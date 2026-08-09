/**
 * Generates deterministic k-anonymity dummy noise tokens based on user salt seed.
 * Equalizes search token distribution to prevent frequency analysis attacks.
 */
export function generateKAnonymityNoiseTokens(userSalt: string, count: number): string[] {
  const noiseTokens: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate deterministic 32-character hex noise string
    let hash = 0;
    const seed = `${userSalt}_noise_${i}`;
    for (let j = 0; j < seed.length; j++) {
      hash = (hash << 5) - hash + seed.charCodeAt(j);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, "0");
    noiseTokens.push((hex + hex + hex + hex).slice(0, 32));
  }

  return noiseTokens;
}
