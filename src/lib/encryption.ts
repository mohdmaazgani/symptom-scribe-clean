import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

let activeKey: CryptoKey | null = null;
let activeSearchKey: CryptoKey | null = null;
let lastToken: string | null = null;

let readyPromise: Promise<{ encryptionKey: CryptoKey; searchKey: CryptoKey }> | null = null;
let readyResolver: ((keys: { encryptionKey: CryptoKey; searchKey: CryptoKey }) => void) | null = null;

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

// Key Derivation
export async function deriveKeyFromToken(token: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const tokenBytes = encoder.encode(token);

  const baseKey = await crypto.subtle.importKey(
    "raw",
    tokenBytes,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const salt = encoder.encode("symptom-scribe-offline-salt");

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

export async function deriveSearchKeyFromToken(token: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const tokenBytes = encoder.encode(token);

  const baseKey = await crypto.subtle.importKey(
    "raw",
    tokenBytes,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const salt = encoder.encode("symptom-scribe-search-salt");

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
let onTokenRefreshCallback: (
  oldKey: CryptoKey,
  newKey: CryptoKey,
  oldSearchKey: CryptoKey,
  newSearchKey: CryptoKey
) => Promise<void> | null = null;

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

async function handleSessionChange(session: Session) {
  const token = session.access_token;
  if (!token) return;

  if (token === lastToken) return;

  const prevToken = lastToken || localStorage.getItem("symptom_scribe_last_token");

  try {
    const newKey = await deriveKeyFromToken(token);
    const newSearchKey = await deriveSearchKeyFromToken(token);

    if (prevToken && prevToken !== token) {
      const oldKey = await deriveKeyFromToken(prevToken);
      const oldSearchKey = await deriveSearchKeyFromToken(prevToken);
      if (onTokenRefreshCallback) {
        await onTokenRefreshCallback(oldKey, newKey, oldSearchKey, newSearchKey);
      }
    }

    setKeys(newKey, newSearchKey);
    lastToken = token;
    localStorage.setItem("symptom_scribe_last_token", token);
  } catch (error) {
    console.error("Failed to derive or rotate encryption keys:", error);
    setKeys(null, null);
    lastToken = null;
    localStorage.removeItem("symptom_scribe_last_token");
  }
}

async function handleSessionClear() {
  setKeys(null, null);
  lastToken = null;
  localStorage.removeItem("symptom_scribe_last_token");
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
