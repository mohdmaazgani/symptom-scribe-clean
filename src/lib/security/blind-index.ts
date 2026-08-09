import { generateKAnonymityNoiseTokens } from "./k-anonymity";

/**
 * Derives a salted HMAC-SHA256 search token for a given plaintext term.
 * Prevents plain-text frequency analysis side-channel attacks on PostgreSQL tables.
 */
export async function generateSaltedBlindIndex(
  term: string,
  userSalt: string
): Promise<string> {
  const normalized = term.trim().toLowerCase();
  const encoder = new TextEncoder();
  
  const keyData = encoder.encode(userSalt);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(normalized)
  );

  const hashArray = Array.from(new Uint8Array(signature));
  const hexHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hexHash.slice(0, 32); // 128-bit truncated blind index token
}

/**
 * Generates an array of salted blind index tokens padded with k-anonymity noise tokens.
 */
export async function generateSecureSearchTokens(
  terms: string[],
  userSalt: string,
  kAnonymityCount: number = 3
): Promise<string[]> {
  const realTokens = await Promise.all(
    terms.map((term) => generateSaltedBlindIndex(term, userSalt))
  );

  const noiseTokens = generateKAnonymityNoiseTokens(userSalt, kAnonymityCount);
  return Array.from(new Set([...realTokens, ...noiseTokens]));
}
