/**
 * Global test setup for Vitest + React Testing Library.
 *
 * This file is executed once before all test suites. It:
 * - Extends Vitest's `expect` with `@testing-library/jest-dom` matchers
 *   (e.g. `toBeInTheDocument`, `toHaveTextContent`, etc.)
 * - Provides a clean starting point for global mocks shared across all tests.
 *
 * To add a new global mock, declare it here so every test file benefits
 * without having to repeat the same setup.
 */
import "@testing-library/jest-dom";
// Initialise i18n so components rendered in tests resolve real translations
// instead of falling back to raw translation keys.
import "@/lib/i18n";

// Mock ResizeObserver for Recharts / ResponsiveContainer in jsdom environment
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

if (typeof global.localStorage === "undefined" || global.localStorage === null) {
  const store = new Map<string, string>();
  global.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] || null,
    get length() {
      return store.size;
    },
  } as Storage;
}
