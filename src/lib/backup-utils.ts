function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToUint8Array(hex: string): Uint8Array {
  const pairs = hex.match(/[\da-f]{2}/gi) || [];
  return new Uint8Array(pairs.map((h) => parseInt(h, 16)));
}

export async function deriveBackupKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 200000,
      hash: "SHA-256",
    },
    baseKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptBackupData(jsonData: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const key = await deriveBackupKey(password, salt);
  
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonData);
  
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  );
  
  const saltHex = arrayBufferToHex(salt.buffer);
  const ivHex = arrayBufferToHex(iv.buffer);
  const ciphertextHex = arrayBufferToHex(ciphertextBuffer);
  
  return `${saltHex}:${ivHex}:${ciphertextHex}`;
}

export async function decryptBackupData(encryptedPayload: string, password: string): Promise<string> {
  const parts = encryptedPayload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid backup file format");
  }
  
  const [saltHex, ivHex, ciphertextHex] = parts;
  const salt = hexToUint8Array(saltHex);
  const iv = hexToUint8Array(ivHex);
  const ciphertext = hexToUint8Array(ciphertextHex);
  
  const key = await deriveBackupKey(password, salt);
  
  try {
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
  } catch (error) {
    throw new Error("Incorrect password or corrupted backup file");
  }
}
