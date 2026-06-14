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
