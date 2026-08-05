import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

let activeKey: CryptoKey | null = null;
let activeSearchKey: CryptoKey | null = null;
let lastToken: string | null = null;

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

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
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

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
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

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    ciphertext
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

async function handleSessionChange(session: Session) {
  const userId = session.user?.id;
  if (!userId) return;

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

  // Derive persistent master key from stored seed (or stable userId fallback)
  //
  // `storedSeed` is the value persisted by `setupKeysFromPassword` (see the
  // "Persisted Master Seed" note above) — reading it here is what lets the
  // app re-derive the same encryption/search keys after a refresh without
  // re-prompting for the password.
  //
  // Note on the fallback: if no seed has been persisted for this user yet
  // (`storedSeed` is null/undefined), `masterSeed` falls back to the raw
  // `userId`. This keeps the app functional (e.g. first load before
  // `setupKeysFromPassword` has run, or for accounts created before this
  // seed mechanism existed) but derives a *weaker*, non-secret-based key,
  // since `userId` is not a secret. This fallback is intentionally left as
  // -is in this PR — flagging it here for anyone evaluating persistence
  // hardening, since removing or changing it changes what key existing
  // encrypted data was written under.
  const storedSeed = localStorage.getItem(SEED_KEY_PREFIX + userId);
  const masterSeed = storedSeed || userId;

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

async function handleSessionClear() {
  // Clear user-specific data on logout.
  //
  // This removes the locally cached salt and master seed so that no key
  // material can be re-derived from this browser/device without the user
  // authenticating again. Note the salt is recoverable on next login (it's
  // also stored in the user's Supabase profile, see the sync logic in
  // `handleSessionChange` above); the seed is not persisted anywhere except
  // the current device, so it is re-derived from the password on next login.
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id) {
    clearUserSalt(user.id);
    localStorage.removeItem(SEED_KEY_PREFIX + user.id);
  }

  setKeys(null, null);
  lastToken = null;
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
  return await decryptText(value, key);
}

export async function decryptProfileArray(
  value: string | null | undefined,
  key: CryptoKey
): Promise<string[]> {
  if (!value) return [];
  const jsonString = await decryptText(value, key);
  return JSON.parse(jsonString);
}

// ─── P2P Emergency Mesh Signatures ──────────────────────────────────────────
export async function getP2PSigningKeys(): Promise<{ privateKey: CryptoKey; publicKey: CryptoKey }> {
  const storedPrivate = localStorage.getItem("symptom_scribe_p2p_private_key");
  const storedPublic = localStorage.getItem("symptom_scribe_p2p_public_key");

  if (storedPrivate && storedPublic) {
    try {
      const privateJwk = JSON.parse(storedPrivate);
      const publicJwk = JSON.parse(storedPublic);

      const privateKey = await crypto.subtle.importKey(
        "jwk",
        privateJwk,
        { name: "ECDSA", namedCurve: "P-256" },
        true,
        ["sign"]
      );

      const publicKey = await crypto.subtle.importKey(
        "jwk",
        publicJwk,
        { name: "ECDSA", namedCurve: "P-256" },
        true,
        ["verify"]
      );

      return { privateKey, publicKey };
    } catch (err) {
      console.warn("Failed to load stored P2P keys, generating new ones:", err);
    }
  }

  // Generate new ECDSA P-256 keypair
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"]
  );

  const privateJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
  const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);

  localStorage.setItem("symptom_scribe_p2p_private_key", JSON.stringify(privateJwk));
  localStorage.setItem("symptom_scribe_p2p_public_key", JSON.stringify(publicJwk));

  return {
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
  };
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

    return await crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" },
      },
      publicKey,
      signatureBytes,
      data
    );
  } catch (err) {
    console.error("Signature verification failed:", err);
    return false;
  }
}