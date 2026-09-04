// RFC 7638 JSON Web Key Thumbprint for EC public keys.
// Used to derive a stable identifier for a mesh device's signing key so
// broadcast-emergency can look it up in mesh_signing_keys regardless of
// property order or extra fields in the JWK the client sends.
export async function ecJwkThumbprint(jwk: JsonWebKey): Promise<string> {
  if (jwk.kty !== "EC" || !jwk.crv || !jwk.x || !jwk.y) {
    throw new Error("Unsupported JWK for thumbprint: expected an EC public key");
  }

  // Member order and exact key set are fixed by RFC 7638 section 3.2.
  const canonical = JSON.stringify({
    crv: jwk.crv,
    kty: jwk.kty,
    x: jwk.x,
    y: jwk.y,
  });

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonical)
  );

  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
