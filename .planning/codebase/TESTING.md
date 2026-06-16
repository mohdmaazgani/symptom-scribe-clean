# Testing Patterns

**Analysis Date:** 2026-06-16

## Test Framework

**Runner:**
- **Vitest** v4.1.8 — configured in `vite.config.ts` (`test` block)
- Runs via SWC (via `@vitejs/plugin-react-swc`) for fast compilation
- Config file: `vite.config.ts` (test configuration co-located with Vite config)

**Assertion Library:**
- **`@testing-library/jest-dom`** v6.9.1 — extends `expect` with DOM matchers (`toBeInTheDocument`, `toHaveTextContent`, `toHaveClass`, `toHaveAttribute`)
- **`@testing-library/react`** v16.3.2 — component rendering and queries
- **`@testing-library/user-event`** v14.6.1 — realistic user interaction simulation

**Run Commands:**
```bash
npm test               # vitest run (single pass)
npm run test:watch     # vitest (watch mode)
npm run test:coverage  # vitest run --coverage
```

**Vitest globals** are enabled (`globals: true` in `vite.config.ts`) — `describe`, `it`, `expect`, `vi`, `beforeEach`, `type Mock` are available without explicit imports.

## Test File Organization

**Location:** Test files are **co-located with source files**, not in a separate directory:
```
src/lib/storage.test.ts              ← alongside src/lib/storage.ts
src/lib/password-strength.test.ts    ← alongside src/lib/password-strength.ts
src/pages/Dashboard.test.tsx          ← alongside src/pages/Dashboard.tsx
src/components/PasswordStrengthMeter.test.tsx  ← alongside src/components/PasswordStrengthMeter.tsx
```

**Naming:** `<source-file-name>.test.<ext>` (`.test.ts` for pure TS, `.test.tsx` for React components)

**Test utilities** live in a dedicated directory:
```
src/test/setup.ts         # Global test setup
src/test/utils.tsx        # Custom render helper
src/test/AllProviders.tsx # Provider wrapper component
```

## Test Structure

**Suite Organization (pattern observed in all test files):**
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
// ... imports of code under test and mocks ...

describe("ComponentOrModuleName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // ... any setup ...
  });

  // Test naming: descriptive sentence in backtick strings
  it("shows a loading state before data resolves", () => { ... });
  it("renders the empty-state prompt when the user has no history", async () => { ... });
});
```

**Patterns:**
- **Setup:** `beforeEach` with `vi.clearAllMocks()` to reset state between tests
- **Teardown:** Not explicit (Vitest's jsdom environment handles cleanup between tests)
- **Assertion pattern:** `expect(screen.getByRole("heading")).toBeInTheDocument()` — use RTL queries + jest-dom matchers
- **Async testing:** `await waitFor(() => { expect(...).toBeInTheDocument(); })` for DOM updates
- **Query priority:** By role first (`getByRole`), then by text (`getByText`), then by label (`getByLabelText`), then query variants for absence checks (`queryByText`, `queryByRole`)

## Mocking

**Framework:** Vitest built-in (`vi.fn()`, `vi.mock()`, `vi.stubGlobal()`)

**Patterns observed:**

### 1. Module-level mocking (`vi.mock`)
```typescript
// Dashboard.test.tsx — complete mock of Supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  },
}));

// Mock a local module
vi.mock("@/lib/toast-helpers", () => ({
  showError: vi.fn(),
  showInfo: vi.fn(),
}));

// Mock an npm dependency (react-countup → renders plain numbers)
vi.mock("react-countup", () => ({
  __esModule: true,
  default: ({ end }: { end: number }) => <span>{end}</span>,
}));
```

### 2. Global stubs (`vi.stubGlobal`)
```typescript
// storage.test.ts — mock localStorage and sessionStorage
vi.stubGlobal("localStorage", mockLocalStorage);
vi.stubGlobal("sessionStorage", mockSessionStorage);

// PasswordStrengthMeter.test.tsx — mock clipboard API
Object.defineProperty(navigator, "clipboard", {
  configurable: true,
  value: { writeText: writeTextMock },
});
```

### 3. Mock return values
```typescript
// Using as Mock from vitest for type safety
import { type Mock } from "vitest";
(getCachedData as Mock).mockResolvedValue({ data, error });
(supabase.auth.getUser as Mock).mockResolvedValue({ data: { user } });
```

**What to Mock:**
- External services: Supabase client, Redis-cached queries
- Browser APIs not available in jsdom: `navigator.clipboard`, `localStorage`/`sessionStorage`
- Third-party libraries with animation/timing: `react-countup` (avoids timer interference)

**What NOT to Mock:**
- Application utilities under test (test the real implementation)
- React Router context (provided by `AllProviders` with `MemoryRouter`)
- React Query (provided by `AllProviders` with real `QueryClient`)

## Fixtures and Factories

**Test Data Pattern (Dashboard.test.tsx):**
```typescript
const sampleSymptoms = [
  {
    id: "1",
    symptoms: "Persistent headache with nausea and light sensitivity",
    severity_level: "high",
    risk_score: 75,
    resolved: false,
    created_at: sevenDaysAgo.toISOString(),
    user_id: mockUser.id,
  },
  // ...
];
```

**Helpers for test mock setup:**
```typescript
// Dashboard.test.tsx
function mockCachedSymptoms(data: unknown[] | null, error: unknown = null) {
  (getCachedData as Mock).mockResolvedValue({ data, error });
}
function mockAuthUser(user: typeof mockUser | null = mockUser) {
  (supabase.auth.getUser as Mock).mockResolvedValue({ data: { user } });
}
```

**Location:** Fixtures are defined inline within test files. No shared fixture files exist.

## Test Utilities

### `src/test/setup.ts`
```typescript
import "@testing-library/jest-dom";
```
- Executed before all test suites
- Extends Vitest's `expect` with jest-dom matchers (`toBeInTheDocument`, `toHaveTextContent`, `toHaveClass`, etc.)
- Designated spot for global mocks shared across all tests

### `src/test/AllProviders.tsx`
- Wraps children with:
  - `QueryClientProvider` with a **fresh** `QueryClient` per test (retry: false, gcTime: 0)
  - `MemoryRouter` with configurable `initialEntries`
- Separate file to avoid React fast-refresh rule violations

### `src/test/utils.tsx`
```typescript
import { render, type RenderOptions } from "@testing-library/react";
import AllProviders from "./AllProviders";

function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & { initialEntries?: string[] }
) {
  const { initialEntries, ...renderOptions } = options ?? {};
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders initialEntries={initialEntries}>{children}</AllProviders>
    ),
    ...renderOptions,
  });
}

// Re-exports everything from @testing-library/react
export * from "@testing-library/react";
export { customRender as render };
```

**Usage in tests:**
```typescript
import { render, screen } from "@/test/utils";

render(<PasswordStrengthMeter value="" onChange={vi.fn()} />);
expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
```

## Current Test Coverage

### Test Files Found (4 files, 692 total lines):

| File | Lines | Type | What's Tested |
|------|-------|------|---------------|
| `src/lib/password-strength.test.ts` | 224 | Unit | Password evaluation, generation, requirements, labels, colors, integration between utilities |
| `src/lib/storage.test.ts` | 93 | Unit | Safe storage get/set, typed storage with TTL, validated storage, storage key validation |
| `src/pages/Dashboard.test.tsx` | 215 | Integration | Loading state, empty state, stat cards, history items, severity colors, error handling, unauthenticated state |
| `src/components/PasswordStrengthMeter.test.tsx` | 160 | Component | Rendering, strength bar visibility, show/hide toggle, onChange calls, password generation, clipboard copy, weak/strong validation, requirements list, custom labels |

### What's Tested vs What's Missing

**Tested areas:**
- Password strength utilities (full coverage of scoring, generation, colors, labels)
- Storage utilities (CRUD, TTL, validation)
- Dashboard page (all UI states: loading, empty, data, error, unauthenticated)
- PasswordStrengthMeter component (all interactive states)

**NOT tested — high priority:**
- `src/lib/env.ts` — Environment variable parsing and diagnostics
- `src/lib/encryption.ts` — AES-GCM encryption for IndexedDB
- `src/lib/offline-db.ts` — Dexie IndexedDB wrapper, sync logic
- `src/lib/cached-queries.ts` — Supabase Edge Function invocation
- `src/lib/toast-helpers.ts` — Toast notification helpers
- `src/lib/utils.ts` — `cn()`, `secureRandomIndex()`, `shuffleArray()` utilities
- `src/lib/password-policy-config.ts` — Password policy configuration

**NOT tested — page components:**
- `src/pages/Auth.tsx` — Authentication (sign-in, sign-up, password reset)
- `src/pages/Chat.tsx` — AI chat interface
- `src/pages/Metrics.tsx` — Health metrics tracking
- `src/pages/History.tsx` — Symptom history
- `src/pages/Profile.tsx` — User profile
- `src/pages/Settings.tsx` — Settings (uses `PasswordStrengthMeter`)
- `src/pages/BrainGames.tsx` — Cognitive games (1862 lines, highest complexity)
- `src/pages/Emergency.tsx` — Emergency information
- `src/pages/Index.tsx` — Landing page
- `src/pages/HealthFacts.tsx`, `src/pages/HealthLibrary.tsx`, `src/pages/Blog.tsx` — Content pages

**NOT tested — infrastructure:**
- `src/components/ProtectedRoute.tsx` — Auth guard
- `src/components/AppSidebar.tsx` — Navigation sidebar
- `src/components/Layout.tsx` — App shell layout
- `src/components/Hero.tsx` — Landing page hero
- `src/components/ErrorBoundary.tsx` — Error boundary
- `src/components/ScrollToTop.tsx` — Scroll management
- `src/components/ChatInterface.tsx` — Chat UI
- `src/components/registration/MultiStepSignUp.tsx` — Sign-up flow
- All supabase integration files (`client.ts`, `supabaseClient.ts`, `types.ts`)
- All hooks: `use-toast.ts`, `use-mobile.tsx`, `useMetricsHistory.ts`

## Coverage

**Configuration (in `vite.config.ts`):**
```typescript
coverage: {
  provider: "v8",
  include: ["src/**/*.{ts,tsx}"],
  exclude: [
    "src/**/*.test.{ts,tsx}",
    "src/test/**",
    "src/vite-env.d.ts",
    "src/main.tsx",
  ],
  reporter: ["text", "html"],
},
```

- **Provider:** v8 (built-in to Node.js)
- **Target:** All `src/` TypeScript files except tests, test utilities, `vite-env.d.ts`, and `main.tsx`
- **View coverage:** `npm run test:coverage` — outputs text report to terminal + HTML report to `coverage/`

**No minimum coverage threshold** is enforced (no `thresholds` config).

## Test Types

**Unit Tests:**
- `src/lib/storage.test.ts` — Pure utility functions tested in isolation
- `src/lib/password-strength.test.ts` — Pure functions with all edge cases
- Pattern: No component rendering, no DOM interaction, just function calls and assertions

**Component Tests:**
- `src/components/PasswordStrengthMeter.test.tsx` — Single component with full interaction coverage
- Pattern: Render component, simulate user events, assert DOM state changes

**Integration Tests:**
- `src/pages/Dashboard.test.tsx` — Page component with mocked external dependencies
- Pattern: Mock Supabase at module level, render full page, verify all states (loading → data → error)

**E2E Tests:** Not used. No Playwright/Cypress configuration found.

## Common Patterns

**Async Testing:**
```typescript
// Pattern 1: waitFor for DOM updates after async operations
await waitFor(() => {
  expect(screen.getByText("Expected content")).toBeInTheDocument();
});

// Pattern 2: userEvent for realistic interactions
const user = userEvent.setup();
await user.click(button);
await user.type(input, "text");
```

**Error Testing:**
```typescript
// Dashboard.test.tsx — errors handled gracefully (no crash)
it("handles Supabase fetch errors without crashing", async () => {
  mockAuthUser();
  mockCachedSymptoms(null, { message: "Network error" });
  render(<Dashboard />);
  await waitFor(() => {
    expect(screen.getByText("Health Dashboard")).toBeInTheDocument();
  });
});
```

**Absence Testing:**
```typescript
// Use queryBy* for elements that should NOT be present
expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
expect(screen.queryByRole("alert")).not.toBeInTheDocument();
```

**Mock Helpers Pattern:**
- Factory functions are created inline for reusable mock objects (e.g., `createStorageMock()` in `storage.test.ts` returns a full localStorage-compatible mock object)

## Recommendations for Improvement

### 1. Increase Test Coverage (Critical)
Only 4 test files exist for a 200+ file codebase. High-priority targets:
- `src/lib/` — All utility modules should have unit tests (especially `encryption.ts`, `offline-db.ts`, `env.ts`)
- `src/hooks/` — Custom hooks need tests for state management
- `src/components/ProtectedRoute.tsx` — Auth guard is critical path logic
- `src/components/ChatInterface.tsx` — High complexity component

### 2. Add Coverage Thresholds
Set minimum thresholds in `vite.config.ts` to prevent coverage regression:
```typescript
coverage: {
  thresholds: {
    statements: 50,
    branches: 40,
    functions: 40,
    lines: 50,
  },
}
```

### 3. Create Shared Fixtures
Move `sampleSymptoms`-style test data and mock factories into `src/test/fixtures/` to reduce duplication across test files.

### 4. Add React Testing Library ESLint Plugin
Consider `eslint-plugin-testing-library` and `eslint-plugin-jest-dom` to enforce best practices (e.g., prefer `getByRole` over `getByTestId`, disallow `waitFor` on synchronous expectations).

### 5. Add E2E Tests
No E2E tests exist. For a health platform, critical user journeys (auth flow, symptom submission, dashboard loading) should be tested with Playwright or Cypress.

### 6. Test Supabase Integrations
Add mock-wrapped tests for all Supabase-dependent pages (Auth.tsx, History.tsx, Metrics.tsx, Profile.tsx, Settings.tsx, Chat.tsx) following the same `vi.mock("@/integrations/supabase/client")` pattern used in Dashboard.test.tsx.

---

*Testing analysis: 2026-06-16*
