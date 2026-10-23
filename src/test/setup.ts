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
// Mock localStorage if missing or if running under Node 22+ where global localStorage lacks Storage methods in jsdom
if (!globalThis.localStorage || typeof globalThis.localStorage.getItem !== "function") {
  const store: Record<string, string> = {};
  const mockStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
  Object.defineProperty(globalThis, "localStorage", { value: mockStorage, writable: true, configurable: true });
  if (typeof window !== "undefined") {
    Object.defineProperty(window, "localStorage", { value: mockStorage, writable: true, configurable: true });
  }
}

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
