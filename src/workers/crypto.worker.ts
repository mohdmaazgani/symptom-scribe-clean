// Web Worker for processing AES-GCM buffer encryption/decryption off the main thread

self.onmessage = async (event: MessageEvent) => {
  const { id, type, payload } = event.data;

  if (type === "ENCRYPT_BATCH") {
    try {
      const { items, keyRaw } = payload;
      const key = await crypto.subtle.importKey(
        "raw",
        keyRaw,
        { name: "AES-GCM" },
        false,
        ["encrypt"]
      );

      const encryptedItems = await Promise.all(
        items.map(async (text: string) => {
          const iv = crypto.getRandomValues(new Uint8Array(12));
          const encoded = new TextEncoder().encode(text);
          const ciphertext = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            key,
            encoded
          );
          
          const combined = new Uint8Array(iv.length + ciphertext.byteLength);
          combined.set(iv, 0);
          combined.set(new Uint8Array(ciphertext), iv.length);
          
          return "enc:" + btoa(String.fromCharCode(...combined));
        })
      );

      self.postMessage({ id, status: "SUCCESS", result: encryptedItems });
    } catch (err: any) {
      self.postMessage({ id, status: "ERROR", error: err?.message || "Encryption failed" });
    }
  }
};

export {};
