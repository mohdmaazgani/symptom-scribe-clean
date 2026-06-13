import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

let activeKey: CryptoKey | null = null;
let lastToken: string | null = null;

let readyPromise: Promise<CryptoKey> | null = null;
let readyResolver: ((key: CryptoKey) => void) | null = null;

function resetReadyPromise() {
  readyPromise = new Promise<CryptoKey>((resolve) => {
    readyResolver = resolve;
  });
}

// Initialize immediately
resetReadyPromise();

export function setKey(key: CryptoKey | null) {
  activeKey = key;
  if (key && readyResolver) {
    readyResolver(key);
  } else if (!key) {
    resetReadyPromise();
  }
}

export function getKey(): CryptoKey | null {
  return activeKey;
}

export async function whenEncryptionReady(): Promise<CryptoKey> {
  if (activeKey) return activeKey;
  if (readyPromise) return readyPromise;
  resetReadyPromise();
  return readyPromise!;
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
let onTokenRefreshCallback: ((oldKey: CryptoKey, newKey: CryptoKey) => Promise<void>) | null = null;

export function registerEncryptionHooks(callbacks: {
  onLogout: () => Promise<void>;
  onTokenRefresh: (oldKey: CryptoKey, newKey: CryptoKey) => Promise<void>;
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

    if (prevToken && prevToken !== token) {
      const oldKey = await deriveKeyFromToken(prevToken);
      if (onTokenRefreshCallback) {
        await onTokenRefreshCallback(oldKey, newKey);
      }
    }

    setKey(newKey);
    lastToken = token;
    localStorage.setItem("symptom_scribe_last_token", token);
  } catch (error) {
    console.error("Failed to derive or rotate encryption keys:", error);
    setKey(null);
    lastToken = null;
    localStorage.removeItem("symptom_scribe_last_token");
  }
}

async function handleSessionClear() {
  setKey(null);
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
