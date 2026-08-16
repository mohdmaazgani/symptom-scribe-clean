import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

let activeKey: CryptoKey | null = null;
let activeSearchKey: CryptoKey | null = null;
let lastToken: string | null = null;
/** Last authenticated user id — needed on logout because getUser() is empty after sign-out. */
let lastKnownUserId: string | null = null;

let readyPromise: Promise<{ encryptionKey: CryptoKey; searchKey: CryptoKey }> | null = null;
let readyResolver: ((keys: { encryptionKey: CryptoKey; searchKey: CryptoKey }) => void) | null = null;

/*
 * Security Trade-off:
 *
 * Persisting key material improves user experience because encrypted
 * data remains readable after page reloads.
 *
 * Stronger persistence mechanisms (such as non-extractable keys or
 * encrypted local storage) may be considered in future revisions,
 * but would require migration logic to preserve compatibility.
 */

function resetReadyPromise() {
  readyPromise = new Promise<{ encryptionKey: CryptoKey; searchKey: CryptoKey }>((resolve) => {
    readyResolver = resolve;
  });
}

// Initialize immediately
resetReadyPromise();

export function setKeys(encryptionKey: CryptoKey | null, searchKey: CryptoKey | null) {
  activeKey = encryptionKey;
  activeSearchKey = searchKey;
  if (encryptionKey && searchKey && readyResolver) {
    readyResolver({ encryptionKey, searchKey });
  } else if (!encryptionKey || !searchKey) {
    resetReadyPromise();
  }
}

export function setKey(key: CryptoKey | null) {
  activeKey = key;
}

export function getKey(): CryptoKey | null {
  return activeKey;
}

export function getSearchKey(): CryptoKey | null {
  return activeSearchKey;
}

export async function whenKeysReady(): Promise<{ encryptionKey: CryptoKey; searchKey: CryptoKey }> {
  if (activeKey && activeSearchKey) return { encryptionKey: activeKey, searchKey: activeSearchKey };
  if (readyPromise) return readyPromise;
  resetReadyPromise();
  return readyPromise!;
}

export async function whenEncryptionReady(): Promise<CryptoKey> {
  const keys = await whenKeysReady();
  return keys.encryptionKey;
}

export async function whenSearchReady(): Promise<CryptoKey> {
  const keys = await whenKeysReady();
  return keys.searchKey;
}

// ─── Encryption lock state (issue #1056) ─────────────────────────────────────
// When a session exists but no persisted master seed is available, keys must
// NOT be derived from public material (the old `userId` fallback). Instead the
// keys stay "locked" until the user re-enters their password. The app-level
// unlock dialog subscribes via `subscribeEncryptionLock`.
let encryptionLocked = false;
let unlockInProgress = false;
const encryptionLockListeners = new Set<(locked: boolean) => void>();

export function subscribeEncryptionLock(listener: (locked: boolean) => void): () => void {
  encryptionLockListeners.add(listener);
  listener(encryptionLocked);
  return () => {
    encryptionLockListeners.delete(listener);
  };
}

function setEncryptionLocked(locked: boolean) {
  if (encryptionLocked === locked) return;
  encryptionLocked = locked;
  encryptionLockListeners.forEach((listener) => listener(locked));
}

// Helper functions for Hex conversion
function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToUint8Array(hex: string): Uint8Array {
  const pairs = hex.match(/[\da-f]{2}/gi) || [];
  return new Uint8Array(pairs.map((h) => parseInt(h, 16)));
}

// ─── Per-user PBKDF2 Salt ────────────────────────────────────────────────────
// A random 16-byte salt is generated once per user and stored in localStorage
// keyed by user ID. This prevents cross-user precomputation attacks that would
// be possible with a hardcoded global salt.
//
// Persistence rationale:
// - What is stored: a 16-byte random value, hex-encoded, under
//   `SALT_KEY_PREFIX + userId` in localStorage.
// - Why it is stored: PBKDF2 must be run with the *same* salt every time to
//   re-derive the same AES/HMAC keys from the master seed. If the salt were
//   regenerated on each session, previously encrypted/indexed data would
//   become undecryptable and unsearchable.
// - When it is restored: on every session change, before keys are derived
//   (see `handleSessionChange`), and is also synced from the user's Supabase
//   profile (`encryption_salt`) so the same salt is available across devices.
// - Why changing it would break existing data: the salt is a direct input to
//   key derivation. Rotating or discarding a user's salt without a
//   re-encryption migration will silently produce a different key and make
//   all previously encrypted fields and blind-index search tokens
//   unreadable/unmatchable.

const SALT_KEY_PREFIX = "symptom_scribe_pbkdf2_salt_";

function getUserSalt(userId: string): Uint8Array {
  const storageKey = SALT_KEY_PREFIX + userId;
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    const pairs = stored.match(/[\da-f]{2}/gi) || [];
    return new Uint8Array(pairs.map((h) => parseInt(h, 16)));
  }
  const newSalt = crypto.getRandomValues(new Uint8Array(16));
  const hex = Array.from(newSalt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  localStorage.setItem(storageKey, hex);
  return newSalt;
}

export function clearUserSalt(userId: string): void {
  localStorage.removeItem(SALT_KEY_PREFIX + userId);
}

// Key Derivation
export async function deriveKeyFromToken(token: string, userId?: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const tokenBytes = encoder.encode(token);

  const baseKey = await crypto.subtle.importKey(
    "raw",
    tokenBytes,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  // Use per-user random salt when userId is available; fall back to a
  // deterministic domain salt for unauthenticated derivation paths.
  const salt = userId
    ? getUserSalt(userId)
    : encoder.encode("symptom-scribe-offline-salt");

  // `salt` is always a Uint8Array at runtime (getUserSalt() or TextEncoder).
  // The cast only reconciles TS 5.7's generic Uint8Array<ArrayBufferLike>
  // typing with WebCrypto's BufferSource — no runtime conversion happens, and
  // none is needed.
  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function deriveSearchKeyFromToken(token: string, userId?: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const tokenBytes = encoder.encode(token);

  const baseKey = await crypto.subtle.importKey(
    "raw",
    tokenBytes,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const salt = userId
    ? getUserSalt(userId)
    : encoder.encode("symptom-scribe-search-salt");

  // Same as deriveKeyFromToken: `salt` is always a Uint8Array at runtime; the
  // cast only satisfies the TS Uint8Array<ArrayBufferLike> vs BufferSource
  // typing gap.
  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    {
      name: "HMAC",
      hash: "SHA-256",
      length: 256,
    },
    true,
    ["sign", "verify"]
  );
}

// Tokenizer & Blind Index Generation
export function tokenizeText(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

export async function generateBlindIndex(word: string, searchKey: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(word);
  const signatureBuffer = await crypto.subtle.sign(
    { name: "HMAC" },
    searchKey,
    data
  );
  return arrayBufferToHex(signatureBuffer);
}

export async function generateSearchTokens(text: string, searchKey: CryptoKey): Promise<string[]> {
  const tokens = tokenizeText(text);
  if (tokens.length === 0) return [];
  const uniqueTokens = Array.from(new Set(tokens));
  return await Promise.all(
    uniqueTokens.map((token) => generateBlindIndex(token, searchKey))
  );
}

// Encryption / Decryption
export async function encryptText(text: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  );

  const ivHex = arrayBufferToHex(iv.buffer);
  const ciphertextHex = arrayBufferToHex(ciphertextBuffer);

  return `${ivHex}:${ciphertextHex}`;
}

export async function decryptText(encryptedText: string, key: CryptoKey): Promise<string> {
  const parts = encryptedText.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted text format");
  }

  const [ivHex, ciphertextHex] = parts;
  const iv = hexToUint8Array(ivHex);
  const ciphertext = hexToUint8Array(ciphertextHex);

  // `iv`/`ciphertext` are Uint8Arrays decoded from the hex `ivHex:cipherHex`
  // format produced by encryptText(), so they are always byte arrays at
  // runtime. The casts only reconcile TS 5.7's generic Uint8Array<ArrayBufferLike>
  // typing with WebCrypto's BufferSource — no runtime conversion is needed.
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv as BufferSource,
    },
    key,
    ciphertext as BufferSource
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

// Callbacks registered by offline-db
let onLogoutCallback: (() => Promise<void>) | null = null;

let onTokenRefreshCallback: ((
  oldKey: CryptoKey,
  newKey: CryptoKey,
  oldSearchKey: CryptoKey,
  newSearchKey: CryptoKey
) => Promise<void>) | null = null;

export function registerEncryptionHooks(callbacks: {
  onLogout: () => Promise<void>;
  onTokenRefresh: (
    oldKey: CryptoKey,
    newKey: CryptoKey,
    oldSearchKey: CryptoKey,
    newSearchKey: CryptoKey
  ) => Promise<void>;
}) {
  onLogoutCallback = callbacks.onLogout;
  onTokenRefreshCallback = callbacks.onTokenRefresh;
}

// ─── Persisted Master Seed ───────────────────────────────────────────────────
// The master seed is a PBKDF2-derived value (password + email) that all
// encryption/search keys are ultimately re-derived from. It is persisted in
// localStorage, keyed by user ID, under `SEED_KEY_PREFIX`.
//
// Persistence rationale:
// - What is stored: the hex-encoded output of `deriveSeedFromPassword`, i.e.
//   a value derived from the user's password and email, not the raw
//   password itself.
// - Why it is stored: the Supabase session (access token) persists across
//   reloads independently of this seed, but the encryption key is derived
//   from the password-based seed, not the session token. Without persisting
//   the seed locally, a page refresh or new tab would leave the app holding
//   a valid session but no way to re-derive the encryption key without
//   asking the user to re-enter their password.
// - When it is restored: read in `handleSessionChange`, whenever the
//   Supabase auth state fires (initial load, token refresh, tab focus,
//   etc.), and used to re-derive the AES-GCM and HMAC keys.
// - Why it is required: encrypted records and blind-index search tokens are
//   only ever derived from this seed. There is no server-side copy — losing
//   it (without the password) means existing encrypted data cannot be
//   decrypted.
// - Why changing this would break existing data: any change to how the seed
//   is derived, stored, or looked up changes the key that
//   `deriveKeyFromToken`/`deriveSearchKeyFromToken` produce. Since AES-GCM
//   ciphertext and HMAC blind indexes are only valid under the exact key
//   they were created with, existing rows would become undecryptable and
//   unsearchable unless a re-encryption migration accompanies the change.
//   This is intentionally left untouched here; see `handleSessionChange`
//   below for a related fallback behavior worth reviewing before any future
//   redesign.

const SEED_KEY_PREFIX = "symptom_scribe_master_seed_";

// Helper to derive stable master seed from password + email using PBKDF2
export async function deriveSeedFromPassword(password: string, email: string): Promise<string> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  // Use email as a stable salt for password derivation
  const salt = encoder.encode(email.toLowerCase().trim());
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    256
  );
  return arrayBufferToHex(derivedBits);
}

// Function called during login/signup/password-change to store seed and active keys
export async function setupKeysFromPassword(password: string, email: string, userId: string): Promise<void> {
  const seed = await deriveSeedFromPassword(password, email);
  // Persisted so the seed survives reloads/new sessions without requiring
  // the password again — see "Persisted Master Seed" note above for the
  // full rationale and backward-compatibility considerations.
  localStorage.setItem(SEED_KEY_PREFIX + userId, seed);

  const newKey = await deriveKeyFromToken(seed, userId);
  const newSearchKey = await deriveSearchKeyFromToken(seed, userId);
  setKeys(newKey, newSearchKey);
  lastToken = seed;
  // Keys are now available — dismiss any "enter password to unlock" state.
  setEncryptionLocked(false);
}

// Helper to trigger Key Rotation for components (like Settings page password change)
export async function triggerKeyRotation(
  oldKey: CryptoKey,
  newKey: CryptoKey,
  oldSearchKey: CryptoKey,
  newSearchKey: CryptoKey
): Promise<void> {
  if (onTokenRefreshCallback) {
    await onTokenRefreshCallback(oldKey, newKey, oldSearchKey, newSearchKey);
  }
}

/**
 * Re-derives the user's encryption keys from a *new* password and re-encrypts
 * all existing data (local IndexedDB + server-side Supabase rows) under the
 * new key.
 *
 * Must be called after `supabase.auth.updateUser({ password })` succeeds
 * (Settings "Change Password" and ResetPassword). Without it, records that
 * were encrypted under the old password-derived seed become undecryptable the
 * moment the new key is activated (issue #999).
 *
 * If no old key is available on this device (e.g. a forgotten-password reset
 * opened on a fresh browser where the old seed was never persisted), rotation
 * is skipped: the old key is unrecoverable by design, and decrypting old
 * ciphertext with the fallback key would corrupt it.
 *
 * @returns `true` when existing data was re-encrypted under the new key, and
 *          `false` when no old key was available so old records cannot be
 *          recovered (callers should inform the user in that case).
 */
export async function rotateKeysToNewPassword(
  newPassword: string,
  email: string,
  userId: string
): Promise<boolean> {
  const oldKey = getKey();
  const oldSearchKey = getSearchKey();

  // Persist the new seed and activate the new keys before rotating data.
  await setupKeysFromPassword(newPassword, email, userId);

  if (!oldKey || !oldSearchKey) {
    console.warn(
      "No active encryption key before password change — existing encrypted " +
        "records on this device cannot be re-encrypted."
    );
    return false;
  }

  const newKey = getKey();
  const newSearchKey = getSearchKey();

  if (!newKey || !newSearchKey) {
    console.warn("New encryption keys could not be derived; existing records were not rotated.");
    return false;
  }

  await triggerKeyRotation(oldKey, newKey, oldSearchKey, newSearchKey);
  return true;
}

// ─── Legacy (pre-seed) data migration (issue #1056) ──────────────────────────
// Accounts created before the master-seed mechanism wrote encrypted records
// under a key derived from the (public) user id. Once the `userId` fallback is
// removed, those records can only be recovered when the user proves their
// password: we re-derive the legacy key, detect records still encrypted under
// it, and rotate them onto the new seed-derived key via the existing
// onTokenRefresh re-encryption machinery.

type LegacyKeyProbe = (
  legacyKey: CryptoKey,
  legacySearchKey: CryptoKey
) => Promise<boolean>;

let legacyKeyProbeCallback: LegacyKeyProbe | null = null;

/**
 * Registers a callback (implemented in offline-db.ts, which owns the Dexie
 * instance and the Supabase table access) that reports whether any encrypted
 * records are still keyed by the pre-seed userId-derived key. Kept behind a
 * registration hook so encryption.ts never imports the Dexie module directly
 * (avoids a circular dependency).
 */
export function registerLegacyKeyProbe(probe: LegacyKeyProbe): void {
  legacyKeyProbeCallback = probe;
}

export interface KeyUnlockResult {
  ok: boolean;
  migratedLegacy: boolean;
  error?: string;
}

/**
 * Unlocks the encryption keys for the current session using the user's
 * password (issue #1056).
 *
 * Called by the app-level unlock dialog whenever a session exists but no
 * master seed is persisted (see `handleSessionChange`). Steps:
 * 1. Validates the password via Supabase re-auth — a wrong password must never
 *    silently derive a wrong seed, which would strand the user's data.
 * 2. Re-derives the pre-seed legacy keypair from the (public) user id and
 *    probes for records still encrypted under it.
 * 3. Persists the seed and activates the new seed-derived keys.
 * 4. If legacy records exist, rotates them onto the new key (decrypt with the
 *    legacy key, re-encrypt with the new key — local IndexedDB + server rows).
 *
 * @returns `{ ok, migratedLegacy }` — when `ok` is false, `error` holds a
 *          user-facing message.
 */
export async function unlockEncryptionWithPassword(
  password: string,
  email?: string
): Promise<KeyUnlockResult> {
  if (unlockInProgress) {
    return { ok: false, migratedLegacy: false, error: "An unlock is already in progress." };
  }
  // Set synchronously so the auth events fired by the re-auth call below (and
  // any concurrent call) cannot re-enter or clobber this flow.
  unlockInProgress = true;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;
    const userEmail = (email || user?.email || "").toLowerCase().trim();

    if (!userId || !userEmail) {
      return {
        ok: false,
        migratedLegacy: false,
        error: "No active session with a recoverable email was found.",
      };
    }

    // Keys already available (seed present + active keys) — nothing to unlock.
    if (localStorage.getItem(SEED_KEY_PREFIX + userId) && getKey() && getSearchKey()) {
      return { ok: true, migratedLegacy: false };
    }

    // 1. Validate the password. Same re-auth pattern as the Settings page.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password,
    });
    if (signInError) {
      // Accounts with two-factor authentication cannot complete the extra
      // challenge from this dialog; point them to the normal sign-in flow.
      if (signInError.code === "mfa_required" || /mfa|two.factor/i.test(signInError.message ?? "")) {
        return {
          ok: false,
          migratedLegacy: false,
          error:
            "Two-factor authentication is enabled on this account. Sign out and sign in again to unlock your data.",
        };
      }
      return { ok: false, migratedLegacy: false, error: signInError.message };
    }

    // 2. Legacy (pre-seed) keypair — deterministic from the user id + salt.
    const legacyKey = await deriveKeyFromToken(userId, userId);
    const legacySearchKey = await deriveSearchKeyFromToken(userId, userId);
    const hasLegacyData = legacyKeyProbeCallback
      ? await legacyKeyProbeCallback(legacyKey, legacySearchKey)
      : false;

    // 3. Persist the seed and activate the new seed-derived keys.
    await setupKeysFromPassword(password, userEmail, userId);

    // 4. Migrate any pre-seed records onto the new seed-derived key.
    if (hasLegacyData) {
      const newKey = getKey();
      const newSearchKey = getSearchKey();
      if (newKey && newSearchKey) {
        await triggerKeyRotation(legacyKey, newKey, legacySearchKey, newSearchKey);
        return { ok: true, migratedLegacy: true };
      }
    }

    return { ok: true, migratedLegacy: false };
  } catch (err) {
    console.error("Failed to unlock encryption keys:", err);
    return {
      ok: false,
      migratedLegacy: false,
      error: "Failed to unlock your data. Please try again.",
    };
  } finally {
    unlockInProgress = false;
  }
}

async function handleSessionChange(session: Session) {
  const userId = session.user?.id;
  if (!userId) return;

  // A different user took over the session (e.g. account switch without a full
  // sign-out): the active keys belong to the previous user and must not be
  // reused for this one.
  if (lastKnownUserId && lastKnownUserId !== userId) {
    clearPersistedKeyMaterial(lastKnownUserId);
    setKeys(null, null);
    lastToken = null;
  }

  lastKnownUserId = userId;

  const token = session.access_token;
  if (!token) return;

  // Synchronize user salt across devices.
  //
  // The salt is cached locally (see "Per-user PBKDF2 Salt" above) but is
  // also written to the user's Supabase profile (`encryption_salt`) so a
  // second device/browser can pick up the *same* salt instead of generating
  // its own. If the local and remote values ever diverge, the remote
  // (`dbSalt`) value wins here so all devices converge on one salt.
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("encryption_salt")
      .eq("user_id", userId)
      .maybeSingle();

    const dbSalt = profile?.encryption_salt;
    const localSalt = localStorage.getItem(SALT_KEY_PREFIX + userId);

    if (dbSalt) {
      if (dbSalt !== localSalt) {
        localStorage.setItem(SALT_KEY_PREFIX + userId, dbSalt);
      }
    } else {
      const activeSalt = localSalt || (() => {
        const newSalt = crypto.getRandomValues(new Uint8Array(16));
        return Array.from(newSalt)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      })();

      localStorage.setItem(SALT_KEY_PREFIX + userId, activeSalt);

      // Save salt to both the database profile and user metadata
      await Promise.all([
        supabase.from("profiles").upsert({
          user_id: userId,
          encryption_salt: activeSalt,
        }, { onConflict: "user_id" }),
        supabase.auth.updateUser({
          data: { encryption_salt: activeSalt }
        })
      ]).catch((syncErr) => {
        console.warn("Failed to sync salt to Supabase profiles or auth metadata:", syncErr);
      });
    }
  } catch (saltErr) {
    console.error("Failed to sync encryption salt from profiles:", saltErr);
  }

  // Derive the persistent master key from the stored seed.
  //
  // `storedSeed` is the value persisted by `setupKeysFromPassword` (see the
  // "Persisted Master Seed" note above) — reading it here is what lets the
  // app re-derive the same encryption/search keys after a refresh without
  // re-prompting for the password.
  //
  // Issue #1056: when no seed is persisted the app must NOT fall back to
  // deriving keys from the public `userId` (the old behavior). Anyone who
  // knows the user id plus the per-user salt (both public — the salt is
  // synced to the profile and auth metadata) could re-derive the key and
  // decrypt records written under it. Instead the keys stay locked until the
  // user re-enters their password (see `unlockEncryptionWithPassword`), which
  // re-derives and persists the seed. Pre-seed records encrypted under the
  // legacy userId-derived key are migrated onto the new key during unlock.
  const storedSeed = localStorage.getItem(SEED_KEY_PREFIX + userId);

  if (!storedSeed) {
    // While `unlockEncryptionWithPassword` runs, the re-auth call it makes
    // fires auth events that reach this handler — do not clobber the keys
    // that flow is about to set.
    if (unlockInProgress) return;
    // Normal sign-in derives and persists the seed immediately after signing
    // in, so this handler may resume after the keys are already active;
    // leave them in place.
    if (getKey() && getSearchKey()) return;

    setKeys(null, null);
    lastToken = null;
    setEncryptionLocked(true);
    return;
  }

  const masterSeed = storedSeed;

  if (masterSeed === lastToken && getKey()) return;

  const prevToken = lastToken;

  try {
    const newKey = await deriveKeyFromToken(masterSeed, userId);
    const newSearchKey = await deriveSearchKeyFromToken(masterSeed, userId);

    if (prevToken && prevToken !== masterSeed && getKey()) {
      const oldKey = await deriveKeyFromToken(prevToken, userId);
      const oldSearchKey = await deriveSearchKeyFromToken(prevToken, userId);
      if (onTokenRefreshCallback) {
        await onTokenRefreshCallback(oldKey, newKey, oldSearchKey, newSearchKey);
      }
    }

    setKeys(newKey, newSearchKey);
    lastToken = masterSeed;
  } catch (error) {
    console.error("Failed to derive encryption keys:", error);
    setKeys(null, null);
    lastToken = null;
  }
}

function clearPersistedKeyMaterial(userId: string) {
  clearUserSalt(userId);
  localStorage.removeItem(SEED_KEY_PREFIX + userId);
}

async function handleSessionClear() {
  // Clear user-specific data on logout.
  //
  // Prefer lastKnownUserId: by the time onAuthStateChange fires with
  // session === null, supabase.auth.getUser() no longer returns the user,
  // so gating the wipe on getUser() left seed/salt in localStorage.
  const { data: { user } } = await supabase.auth.getUser();
  const userId = lastKnownUserId || user?.id || null;

  if (userId) {
    clearPersistedKeyMaterial(userId);
  } else {
    // Belt-and-suspenders: wipe any leftover seed/salt keys if we lost the id.
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith(SEED_KEY_PREFIX) || key.startsWith(SALT_KEY_PREFIX))
      ) {
        localStorage.removeItem(key);
      }
    }
  }

  lastKnownUserId = null;
  setKeys(null, null);
  lastToken = null;
  // No session → no lock prompt needed.
  setEncryptionLocked(false);
  if (onLogoutCallback) {
    await onLogoutCallback();
  }
}

let isInitializing = false;

export function initializeEncryption() {
  if (isInitializing) return;
  isInitializing = true;

  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (session) {
      await handleSessionChange(session);
    }
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (session) {
        await handleSessionChange(session);
      } else {
        await handleSessionClear();
      }
    }
  );

  return () => {
    subscription.unsubscribe();
    isInitializing = false;
  };
}

// ─── Profile Field Encryption Helpers ───────────────────────────────────────
// Wrapper functions used by App.tsx to encrypt profile data during auth flow.

export async function encryptProfileField(
  value: string | null | undefined,
  key: CryptoKey
): Promise<string | null> {
  if (!value) return null;
  return await encryptText(value, key);
}

export async function encryptProfileArray(
  values: string[] | null | undefined,
  key: CryptoKey
): Promise<string | null> {
  if (!values || values.length === 0) return null;
  const jsonString = JSON.stringify(values);
  return await encryptText(jsonString, key);
}

export async function decryptProfileField(
  value: string | null | undefined,
  key: CryptoKey
): Promise<string> {
  if (!value) return "";
  // Plaintext (e.g. legacy) values pass through untouched instead of throwing.
  if (!looksEncrypted(value)) return value;
  try {
    return await decryptText(value, key);
  } catch (err) {
    console.warn("Failed to decrypt profile field; returning an empty value.", err);
    return "";
  }
}

export async function decryptProfileArray(
  value: string | null | undefined,
  key: CryptoKey
): Promise<string[]> {
  if (!value) return [];

  let jsonString: string;
  if (looksEncrypted(value)) {
    try {
      jsonString = await decryptText(value, key);
    } catch (err) {
      console.warn("Failed to decrypt profile array; returning an empty array.", err);
      return [];
    }
  } else {
    // Plaintext (legacy) JSON array stored directly.
    jsonString = value;
  }

  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch (err) {
    console.warn("Failed to parse profile array; returning an empty array.", err);
    return [];
  }
}

// A stored profile value is treated as encrypted only when it matches the
// `ivHex:cipherHex` shape produced by `encryptText`. Anything else is legacy
// plaintext and is passed through as-is.
function looksEncrypted(value: string): boolean {
  const parts = value.split(":");
  return (
    parts.length === 2 &&
    /^[0-9a-f]+$/i.test(parts[0]) &&
    /^[0-9a-f]+$/i.test(parts[1])
  );
}

// ─── P2P Emergency Mesh Signatures ──────────────────────────────────────────
//
// The ECDSA P-256 private key used to sign emergency mesh alerts is generated
// as *non-extractable* (`extractable: false`), so it can never be exported
// (e.g. as a JWK) by a compromised script, extension, or injected library.
// Persistence is delegated to IndexedDB via `registerP2PKeyStorage` (see
// offline-db.ts): IndexedDB's structured-clone algorithm can store
// non-extractable CryptoKey objects, so the key survives reloads without ever
// existing as portable key material outside the browser. Only the public key
// remains extractable, and only its JWK is ever shared (broadcast with
// alerts so peers can verify the signature).
//
// This replaces the previous implementation (issue #1085) which stored the
// private key as a plaintext, extractable JWK in localStorage under
// `symptom_scribe_p2p_private_key` — any XSS/extension with localStorage
// access could exfiltrate it and forge emergency alerts.

type P2PKeyPair = { privateKey: CryptoKey; publicKey: CryptoKey };

type P2PKeyStorage = {
  load: () => Promise<P2PKeyPair | null>;
  save: (privateKey: CryptoKey, publicKey: CryptoKey) => Promise<void>;
};

let p2pKeyStorage: P2PKeyStorage | null = null;
let cachedP2PKeys: P2PKeyPair | null = null;

/**
 * Registers the IndexedDB-backed persistence for the P2P signing keypair.
 * Called by offline-db.ts during module initialization; kept behind a
 * registration hook so encryption.ts never imports the Dexie module directly
 * (avoiding a circular dependency).
 */
export function registerP2PKeyStorage(storage: P2PKeyStorage): void {
  p2pKeyStorage = storage;
}

// Generates an ECDSA P-256 keypair whose *private* half is non-extractable.
// `crypto.subtle.generateKey` applies one extractability flag to the whole
// pair, so the private JWK is exported in memory only and immediately
// re-imported with `extractable: false`. The public half stays extractable so
// its JWK can be attached to broadcast alerts for signature verification.
async function generateNonExtractableP2PKeyPair(): Promise<P2PKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"]
  );

  const privateJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    privateJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  return { privateKey, publicKey: keyPair.publicKey };
}

export async function getP2PSigningKeys(): Promise<P2PKeyPair> {
  // Remove any plaintext JWK copies left behind by the pre-#1085
  // implementation. Nothing reads them anymore, and the private key must
  // never live in localStorage.
  localStorage.removeItem("symptom_scribe_p2p_private_key");
  localStorage.removeItem("symptom_scribe_p2p_public_key");

  // 1. Prefer the IndexedDB-persisted keypair (survives reloads; other tabs
  //    of the same origin share it). If IndexedDB access fails (e.g. private
  //    browsing / disabled storage), fall back to cache or a fresh pair so an
  //    emergency alert can still be signed.
  if (p2pKeyStorage) {
    try {
      const stored = await p2pKeyStorage.load();
      if (stored) {
        cachedP2PKeys = stored;
        return stored;
      }
    } catch (err) {
      console.warn("Failed to load P2P signing keys from IndexedDB; using in-memory keys:", err);
    }
  }

  // 2. Fall back to the in-memory cache (used when no store is registered).
  if (cachedP2PKeys) return cachedP2PKeys;

  // 3. Generate a fresh non-extractable pair and persist it.
  const keys = await generateNonExtractableP2PKeyPair();
  cachedP2PKeys = keys;
  if (p2pKeyStorage) {
    try {
      await p2pKeyStorage.save(keys.privateKey, keys.publicKey);
    } catch (err) {
      console.warn("Failed to persist P2P signing keys to IndexedDB:", err);
    }
  }
  return keys;
}

export async function signPayload(payload: string, privateKey: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const signatureBuffer = await crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    privateKey,
    data
  );
  return arrayBufferToHex(signatureBuffer);
}

export async function verifyPayload(
  payload: string,
  signatureHex: string,
  publicKeyJwk: JsonWebKey
): Promise<boolean> {
  try {
    const publicKey = await crypto.subtle.importKey(
      "jwk",
      publicKeyJwk,
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["verify"]
    );

    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const signatureBytes = hexToUint8Array(signatureHex);

    // `signatureBytes` is a Uint8Array decoded from the hex signature string
    // produced by signPayload(); the cast only reconciles the TS typing.
    return await crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" },
      },
      publicKey,
      signatureBytes as BufferSource,
      data
    );
  } catch (err) {
    console.error("Signature verification failed:", err);
    return false;
  }
}