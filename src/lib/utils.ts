import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a cryptographically secure random index in the range [0, limit - 1] using window.crypto.getRandomValues().
 * This is used for security-sensitive operations such as password generation.
 * 
 * @param limit The upper bound (exclusive) for the random index
 * @returns A cryptographically secure random integer between 0 (inclusive) and limit (exclusive)
 */
export const secureRandomIndex = (limit: number): number => {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] % limit;
};

/**
 * Shuffles an array using the Fisher-Yates (Knuth) algorithm with Math.random().
 * This provides an unbiased, uniform distribution suitable for games, UI layouts, etc.
 * 
 * @param array The array to shuffle
 * @returns A new shuffled array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Shuffles an array using the Fisher-Yates (Knuth) algorithm with cryptographically secure random indices.
 * This is used for security-sensitive shuffling such as passwords.
 * 
 * @param array The array to shuffle
 * @returns A new shuffled array
 */
export function secureShuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = secureRandomIndex(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
