# Coding Conventions

**Analysis Date:** 2026-06-16

## Naming Patterns

**Files:**
- **kebab-case** for library/utility/hook files: `password-strength.ts`, `toast-helpers.ts`, `cached-queries.ts`, `use-mobile.tsx`, `offline-db.ts`, `password-policy-config.ts`
- **PascalCase** for page files: `Dashboard.tsx`, `Auth.tsx`, `AIHealthAssistant.tsx`, `BrainGames.tsx`, `HealthFacts.tsx`
- **PascalCase** for component files: `PasswordStrengthMeter.tsx`, `AnimatedThemeToggler.tsx`, `ErrorBoundary.tsx`, `ProtectedRoute.tsx`, `CardSkeleton.tsx`
- **kebab-case** for shadcn/ui component files: `button.tsx`, `card.tsx`, `input.tsx`, `accordion.tsx`, `dropdown-menu.tsx`
- Test files mirror source filenames with `.test` suffix: `storage.test.ts`, `Dashboard.test.tsx`, `PasswordStrengthMeter.test.tsx`

**Functions:**
- **camelCase** for all functions and methods: `evaluatePasswordStrength()`, `generateStrongPassword()`, `handleGeneratePassword()`, `getSafeLocalStorage()`
- React component functions use **PascalCase**: `function PasswordStrengthMeter()`, `function Dashboard()`
- Event handlers prefixed with `handle`: `handleGeneratePassword`, `handleCopyGenerated`, `handleToggle`
- State setters follow `set` prefix convention: `setShowPassword`, `setCopiedGenerator`, `setSession`

**Variables:**
- **camelCase** for local variables: `queryClient`, `strength`, `nextTheme`, `rawEnv`
- **UPPER_CASE** for true constants: `STORAGE_KEYS`, `SPECIAL_CHARS`, `TOAST_LIMIT`, `MAX_KEY_LENGTH`, `MOBILE_BREAKPOINT`
- Boolean state variables use `is` prefix convention: `isDark`, `isMet`, `isStrong`, `isControlled`, `isMobile`, `isValid`

**Types:**
- **PascalCase** for interfaces and type aliases: `PasswordPolicy`, `PasswordStrengthResult`, `PasswordRequirement`, `LayoutProps`, `BrowserEnv`
- **PascalCase** for React component props interfaces matching component name: `PasswordStrengthMeterProps`, `ProtectedRouteProps`, `AllProvidersProps`
- Type exports are explicit: `export interface PasswordPolicy`, `export type CachedTable`

## TypeScript Strictness

**Current configuration** (`tsconfig.app.json`):
- `"strict": false` — TypeScript is NOT in strict mode
- `"noUnusedLocals": false`, `"noUnusedParameters": false` — unused vars/params do not error
- `"noImplicitAny": false` — implicit `any` is permitted
- `"strictNullChecks": false` — null/undefined checks are not strict

**In practice:**
- Most code avoids `any` where possible, using proper interfaces
- Some files use `as` casts (e.g., `as unknown as Json` in `ChatInterface.tsx`, `as ImportMetaEnv` in `env.ts`)
- The `vite.config.ts` uses `strict: true` but most source code stays at `strict: false`
- CONTRIBUTING.md recommends: "Avoid using `any` types; define clear interfaces and type definitions"

**Path Aliases:**
- `@/` maps to `./src/*` (configured in both `tsconfig.json` and `vite.config.ts`)

## Code Style

**Formatting (Prettier):**
- Tool: Prettier v3.8.3 (`npm run format` / `npm run format:check`)
- Config file: `.prettierrc`
- Key settings:
  - `semi: true` — semicolons required
  - `singleQuote: false` — double quotes always
  - `tabWidth: 2` — 2-space indentation
  - `trailingComma: "es5"` — trailing commas where valid in ES5
  - `printWidth: 100` — max line length 100 chars
  - `endOfLine: "lf"` — Unix line endings

**Linting (ESLint):**
- Tool: ESLint v9.32.0 (flat config format)
- Config file: `eslint.config.js`
- Extends: `@eslint/js` recommended + `typescript-eslint` recommended
- Plugins: `react-hooks`, `react-refresh`
- Key custom rules:
  - `"@typescript-eslint/no-unused-vars": "off"` — unused vars are NOT flagged
  - `"react-refresh/only-export-components": ["warn", { allowConstantExport: true }]` — warns on non-component exports that could break HMR
- Only applies to `**/*.{ts,tsx}` files
- Ignores `dist/`

**Editor Settings (`.editorconfig`):**
- `indent_style = space`, `indent_size = 2`, `end_of_line = lf`
- `insert_final_newline = true`, `trim_trailing_whitespace = true` (except `.md`)

## Import Organization

**Order observed across codebase:**
1. **React/Vite imports**: `import { ... } from "react"`, `import { createRoot } from "react-dom/client"`
2. **Third-party library imports**: `react-router-dom`, `@tanstack/react-query`, `framer-motion`, `lucide-react`, `class-variance-authority`, `clsx`, `zod`
3. **`@/` path aliases** (internal imports):
   - `@/components/ui/...` — UI components (buttons, cards, inputs)
   - `@/components/...` — custom components (Layout, PasswordStrengthMeter)
   - `@/lib/...` — utility modules (storage, utils, env, toast-helpers)
   - `@/hooks/...` — custom hooks (use-toast, use-mobile)
   - `@/integrations/...` — external service integrations (supabase)
   - `@/pages/...` — page components (only in App.tsx)
   - `@/test/utils` — test utilities (only in test files)
4. **Relative imports** for same-directory files: `import ResetPassword from "./pages/ResetPassword.tsx"`, `import Index from "./pages/Index"`
5. **CSS imports** at end: `import "./index.css"`

**No blank-line grouping** conventions enforced — imports flow without forced spacing.

## Component Patterns

**shadcn/ui Wrapper Pattern (Radix Primitives):**
- All UI components in `src/components/ui/` follow the same structure:
  - Import `@radix-ui/*` primitive
  - Import `cn` from `@/lib/utils`
  - Define variants with `class-variance-authority` (`cva`)
  - Use `React.forwardRef` for ref forwarding
  - Set `displayName` on the component
  - Export both the component and variant function

```typescript
// Typical shadcn/ui pattern (e.g., button.tsx, card.tsx, badge.tsx)
import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const Component = React.forwardRef<HTMLElement, Props>(
  ({ className, ...props }, ref) => (
    <element ref={ref} className={cn(baseStyles, className)} {...props} />
  ),
);
Component.displayName = "ComponentName";
export { Component };

// With CVA variants (e.g., button.tsx):
const variants = cva("base-classes", {
  variants: { variant: { default: "...", destructive: "..." }, size: { default: "...", sm: "..." } },
  defaultVariants: { variant: "default", size: "default" },
});
```

**Application Components:**
- Mix of patterns:
  - **Named function exports** for utility components: `export function PasswordStrengthMeter(...)`, `export function ThemeProvider(...)`, `export function AppSidebar()`
  - **Default exports** for page components and larger components: `export default Dashboard`, `export default Layout`, `export default Auth`
  - Inconsistency: Some components use `const Component = () => { ... }; export default Component;` (e.g., `Layout.tsx`, `Hero.tsx`), others use `export default function Component()` (e.g., `NotFound.tsx`)

**Props Pattern (Interfaces):**
- Props defined as `interface ComponentProps` directly above the component, already used in `Layout.tsx`, `ProtectedRoute.tsx`, `PasswordStrengthMeter.tsx`
- Destructured props with defaults at the function signature

## Tailwind Usage Conventions

**Configuration (`tailwind.config.ts`):**
- Dark mode via CSS class strategy: `darkMode: ["class"]`
- Design tokens use CSS variables (HSL color space): `colors: { primary: "hsl(var(--primary))" }`
- CSS variables defined in `src/index.css` in `:root` and `.dark` selectors
- Custom animations defined in `theme.extend.keyframes`: `accordion-down`, `fade-in`, `fade-out`, `float`, `shimmer`, `glow-pulse`
- Custom box shadows: `soft`, `glow`

**In component code:**
- Use the `cn()` utility from `@/lib/utils` (wraps `clsx` + `tailwind-merge`):
  ```typescript
  // In lib/utils.ts
  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
  }
  ```
- All CSS is applied through Tailwind utility classes — no CSS modules, no styled-components
- Responsive breakpoints: `md:hidden`, `md:text-sm`, etc.
- Dark mode: `text-green-600 dark:text-green-400`, `bg-background text-foreground`
- Accessibility: `sr-only`, `focus-visible:ring-2`, `aria-hidden="true"`, `role="alert"`
- Animations: `transition-all duration-200`, `hover:border-primary/40`, Tailwind custom keyframes

## Commit Conventions

**Observed from git log:**
- Conventional commits format: `feat:`, `fix:`, `docs:`, `refactor:`, `bugfix:`
- Merge commits: `Merge pull request #N from user/branch`
- Scope/context in commit messages: `fix: resolve CI errors - change let to const`
- Branch naming per CONTRIBUTING.md: `feature/*`, `fix/*`, `docs/*`, `refactor/*`
- PR titles follow: `feat: <description>`, `fix: <description>`, `docs: <description>`

## Documentation Conventions

**Repository documentation files present:**
- `README.md` — Project overview, features, setup, deployment (534 lines)
- `CHANGELOG.md` — Keep a Changelog format, Semantic Versioning, Unreleased section
- `CONTRIBUTING.md` — Contribution workflow, branch naming, commit guidelines, coding standards (163 lines)
- `CODE_OF_CONDUCT.md` — Community standards (69 lines)
- `SECURITY.md` — Vulnerability reporting (14 lines)
- `FAQ.md` — Frequently asked questions
- `TROUBLESHOOT.md` — Troubleshooting guide
- `.env.example` — Environment variable template
- `PASSWORD_STRENGTH_FEATURE.md` — Feature specification for password strength

**Code documentation:**
- JSDoc/TSDoc comments on exported utility functions (e.g., in `env.ts`, `cached-queries.ts`, `utils.ts`)
- Section headers in files: `// ─── 1. STORAGE KEY REGISTRY ───────────────` style (e.g., `storage.ts`)
- Test files have JSDoc comments explaining test strategy and mock approach

## Function Design

**Size:** Functions range from small utilities (2-5 lines) to larger page components (200-500 lines). Helper functions are extracted for complex logic.

**Parameters:** Destructured props objects for component functions. Named parameters with defaults for utility functions: `(policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY)`.

**Return Values:** Utility functions return typed values. Functions that can fail return union types or use try/catch with fallback values.

## Module Design

**Exports:** Named exports for utilities, mixed named + default exports for components. No barrel files (`index.ts`) are used — components import directly from file paths.

**File organization:**
- `src/components/ui/` — shadcn/ui-generated primitives (50+ files)
- `src/components/` — Application-specific components
- `src/components/legal/` — Legal page sub-components
- `src/components/registration/` — Sign-up flow components
- `src/pages/` — Page-level components (22 files)
- `src/lib/` — Pure utility modules (no JSX)
- `src/hooks/` — Custom React hooks
- `src/integrations/supabase/` — Supabase client and types
- `src/test/` — Test utilities and setup

---

*Convention analysis: 2026-06-16*
