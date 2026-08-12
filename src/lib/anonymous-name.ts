const ADJECTIVES = [
  "Supportive",
  "Hydrated",
  "Mindful",
  "Resilient",
  "Calm",
  "Vibrant",
  "Gentle",
  "Empowered",
  "Radiant",
  "Peaceful",
  "Active",
  "Optimistic",
  "Courageous",
  "Balanced",
  "Serene",
  "Focused",
  "Joyful",
  "Strong",
  "Harmonious",
  "Persistent",
];

const NOUNS = [
  "Squirrel",
  "Panda",
  "Rabbit",
  "Cheetah",
  "Dolphin",
  "Falcon",
  "Otter",
  "Koala",
  "Owl",
  "Phoenix",
  "Tiger",
  "Hero",
  "Explorer",
  "Runner",
  "Stargazer",
  "Beacon",
  "Guardian",
  "Champion",
  "Seeker",
  "Wanderer",
];

/**
 * Hash a string into a simple numeric integer.
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Generates a deterministic anonymous alias for a given user in a specific group.
 * E.g., "SupportiveSquirrel7"
 */
export function generateAnonymousAlias(userId: string, groupId: string): string {
  const seedStr = `${userId}:${groupId}`;
  const hash = simpleHash(seedStr);

  const adjIndex = hash % ADJECTIVES.length;
  const nounIndex = (hash >> 3) % NOUNS.length;
  const numberNum = (hash % 89) + 10; // Number between 10 and 98

  return `${ADJECTIVES[adjIndex]}${NOUNS[nounIndex]}${numberNum}`;
}

/**
 * Generates a random anonymous alias.
 */
export function generateRandomAlias(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${adj}${noun}${num}`;
}
