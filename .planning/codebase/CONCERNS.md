# Codebase Concerns

**Analysis Date:** 2026-06-16

## Security Concerns

### 1. Encryption Key Held in Module-Level Variable (Memory Access)

**Severity:** HIGH
**Location:** `src/lib/encryption.ts:4` — `let activeKey: CryptoKey | null = null;`
**Description:** The AES-GCM encryption key derived from the user's Supabase access token is stored as a plain module-level JavaScript variable. Any XSS injection — even a temporary one via a malicious dependency or reflected input — can call `encryption.getKey()` or access the module scope directly to exfiltrate the key. Since this is a health app storing symptom data, this is a critical privacy risk.
**Recommended action:** Wrap the key in a `WeakRef` or use a dedicated storage mechanism (e.g., `IndexedDB` with a short-lived handle, or a `Symbol`-keyed non-enumerable closure). Consider using the Web Crypto API's `crypto.subtle.wrapKey` to keep it non-exportable.

### 2. Auth Token Stored in Plain localStorage for Key Rotation

**Severity:** HIGH
**Location:** `src/lib/encryption.ts:159` — `localStorage.setItem("symptom_scribe_last_token", token);`
**Description:** The raw Supabase access token is persisted to localStorage as `symptom_scribe_last_token`. This token is later used to re-derive the encryption key on session refresh (line 145). If an attacker accesses localStorage (via XSS, browser extension, or physical access), they can reconstruct the encryption key and decrypt all offline health data.
**Recommended action:** Use a more secure mechanism for token persistence. Options: (a) derive key from a session-bound secret rather than the access token, (b) use `sessionStorage` instead of `localStorage`, or (c) store only a hash of the token. The token should only be held in an HttpOnly cookie set by Supabase.

### 3. Edge Function `verify_jwt = false` Disables Gateway-Level Auth

**Severity:** MEDIUM
**Location:** `supabase/config.toml:4` — `verify_jwt = false`
**Description:** The `symptom-analyzer` edge function has JWT verification disabled at the Supabase gateway level. While the function manually validates tokens with `supabase.auth.getUser(token)`, this means unauthenticated requests can still reach the function's execution environment. This wastes cold-start resources and reduces defense-in-depth. The function has manual verification but it's an extra attack surface.
**Recommended action:** Set `verify_jwt = true` in `supabase/config.toml` and remove redundant manual JWT verification from the function code (lines 69-92 of `supabase/functions/symptom-analyzer/index.ts`). The Supabase gateway handles JWT verification more efficiently.

### 4. `broadcast-emergency` Uses Wildcard CORS (`*`)

**Severity:** MEDIUM
**Location:** `supabase/functions/broadcast-emergency/index.ts:5` — `"Access-Control-Allow-Origin": "*"`
**Description:** Unlike all other edge functions that restrict origins to an allowlist, `broadcast-emergency` uses a wildcard CORS header. This allows any website to make requests to this endpoint. While the function still requires authentication, the broad CORS policy is inconsistent and could enable CSRF-like attacks.
**Recommended action:** Add origin validation consistent with other functions. Change to the same `ALLOWED_ORIGINS` pattern used in `symptom-analyzer/index.ts`.

### 5. No Content Security Policy (CSP) Header

**Severity:** MEDIUM
**Location:** `nginx.conf:1-23`
**Description:** The production nginx configuration does not set a `Content-Security-Policy` header. Without CSP, the app is vulnerable to XSS injection from any unescaped user input or third-party script. For a health application handling sensitive symptom data, this is a significant omission.
**Recommended action:** Add a strict CSP header to `nginx.conf`. Example: `add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://*.supabase.co;";`

### 6. Missing Security Headers in Production Config

**Severity:** MEDIUM
**Location:** `nginx.conf:1-23`
**Description:** The nginx config is missing:
- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
These headers are industry standard for protecting against common web attacks.
**Recommended action:** Add the full set of security headers to `nginx.conf`.

### 7. `console.log` Leaks Personal Health Data

**Severity:** HIGH
**Location:** `src/pages/Profile.tsx:136,160` — `console.log("Current user:", user.id)` and `console.log("Saving profile data:", profileData)`
**Description:** Profile data including `full_name`, `date_of_birth`, `gender`, `blood_type`, `allergies`, `chronic_conditions`, and `emergency_contact_phone` is logged to the browser console in production. This violates health data privacy best practices and could leak sensitive information if users share screenshots or if browser logs are captured by malware.
**Recommended action:** Remove all `console.log` calls in production code. Use a structured logger that can be disabled in production builds.

### 8. No Input Sanitization in Chat/Symptom Search

**Severity:** LOW
**Location:** `src/pages/History.tsx:225-226`
**Description:** User search input is used directly in a case-insensitive comparison (`entry.symptoms.toLowerCase().includes(searchQuery.toLowerCase())`). While not directly vulnerable to stored XSS here, there is no evidence of output sanitization when rendering symptom text in the UI. The `react-markdown` library used in `ChatMessage` (`components/ChatMessage.tsx`) is generally safe, but should be verified.
**Recommended action:** Verify that all user-generated content (symptoms, AI analysis text) is rendered safely. Add explicit sanitization if any `dangerouslySetInnerHTML` is used.

---

## Data Integrity Concerns

### 9. Offline Sync Has No Conflict Resolution Strategy

**Severity:** HIGH
**Location:** `src/lib/offline-db.ts:147-261` — `syncOfflineData()`
**Description:** When the app reconnects after being offline, the sync function applies changes in a simple last-writer-wins pattern. There is no:
- Timestamp comparison for conflicting edits
- Merge strategy for records modified on both client and server
- Version vector or operation log
- User notification about conflicts
If a user edits a symptom record offline while server data also changes, one set of changes is silently lost.
**Recommended action:** Implement a conflict resolution strategy. At minimum: (a) add `updated_at` comparison to detect conflicts, (b) use a "server wins" or "last-write-wins" flag, (c) notify the user when data was overwritten. Consider using CRDTs for full offline-first support.

### 10. No Server-Side Validation for Health Metric Values

**Severity:** MEDIUM
**Location:** `supabase/migrations/20251028170142_672dd19d-264e-4f84-8507-6332bebba974.sql:38-39` — `value JSONB NOT NULL`
**Description:** The `health_metrics.value` column is `JSONB` with no constraints. While the frontend validates ranges (e.g., heart rate 30-250 in `Metrics.tsx:167-171`), there is no server-side validation. A malicious client or API call could insert invalid values (e.g., heart_rate = -9999, blood_pressure with malformed data). Only `metric_type` has a CHECK constraint.
**Recommended action:** Add database CHECK constraints on the JSONB structure for each metric type, or add server-side validation in a Postgres trigger before insert/update.

### 11. Health Metric Offline Records Use `crypto.randomUUID()` for IDs

**Severity:** MEDIUM
**Location:** `src/pages/Metrics.tsx:238` — `const recordId = crypto.randomUUID();`
**Description:** Offline-created records generate their own UUID on the client. While UUIDs are globally unique, if the device clock is wrong or `crypto.randomUUID()` fails silently, there is a collision risk. The sync function relies on ID matching, so a collision would cause data loss.
**Recommended action:** Add a fallback for `crypto.randomUUID()` and implement a collision detection/retry mechanism during sync.

### 12. Chat Messages Stored Locally Without Encryption

**Severity:** MEDIUM
**Location:** `src/lib/offline-db.ts:1-262` (entire file)
**Description:** The offline database has encryption logic for `healthMetrics` and `symptomHistory` tables, but there is no offline storage for `chat_sessions`. Chat data is only stored in Supabase. This means chat history is unavailable offline, but more importantly, if offline chat storage is added later, it must implement the same encryption pattern.
**Recommended action:** If offline chat support is planned, implement it using the same `encryptText`/`decryptText` pattern from `encryption.ts`. Ensure all offline health data is encrypted at rest.

---

## Performance Concerns

### 13. All UI Components Eagerly Imported — No Code Splitting

**Severity:** MEDIUM
**Location:** `src/App.tsx:8-18` — All pages imported statically
**Description:** Every page component is imported eagerly at the top of `App.tsx`. There are no `React.lazy()` or dynamic imports for route-based code splitting. This means the entire application bundle (including rarely-used pages like Emergency, BrainGames, HealthFacts) is loaded on every page visit.
**Recommended action:** Convert all route imports to `React.lazy()` with `<Suspense>` wrappers. This can reduce initial bundle size by 40-60%.

### 14. Large shadcn/ui Component Surface Area

**Severity:** LOW
**Location:** `package.json:19-46` — 25+ `@radix-ui/react-*` packages
**Description:** The project imports a very large number of shadcn/ui components (40+ UI components including chart, carousel, resizable, command, etc.). Many of these may go unused in the shipped application but still contribute to the bundle. Tree-shaking by bundler may mitigate this, but the sheer number of components increases the surface area.
**Recommended action:** Audit component usage and remove unused shadcn/ui components. Consider using `vite-plugin-inspect` to analyze bundle composition.

### 15. Framer Motion for Limited Animation Use

**Severity:** LOW
**Location:** `package.json:56` — `framer-motion: ^12.38.0`
**Description:** Framer Motion (~35KB gzipped) is imported but appears to be used only in `Emergency.tsx` for `AnimatePresence/motion`. For a health app, this is significant bloat for cosmetic animation. The bundle would benefit from either removing framer-motion entirely or restricting it.
**Recommended action:** Replace framer-motion animations with CSS transitions/animations where possible. Consider using `motion-lite` or removing animations entirely from the emergency page.

### 16. Offline Sync Scans All Records on Every Sync

**Severity:** LOW
**Location:** `src/lib/offline-db.ts:157-247`
**Description:** The `syncOfflineData` function queries ALL pending records from IndexedDB and syncs them one by one. For users with thousands of records, this will be slow and may block the UI thread during de/encryption operations.
**Recommended action:** Implement batch processing with limits (e.g., sync 50 records per call). Add pagination for the sync operations and use Dexie's `bulkPut` for batch writes.

---

## Code Quality Concerns

### 17. TypeScript `strict` Mode Completely Disabled

**Severity:** HIGH
**Location:** `tsconfig.app.json:18-22` — `"strict": false`, `"noUnusedLocals": false`, `"noUnusedParameters": false`, `"noImplicitAny": false`
**Description:** TypeScript strict mode is fully disabled. This means:
- `any` types are implicitly allowed anywhere without explicit annotation
- `null`/`undefined` checks are not enforced
- Unused variables and parameters are silently accepted
- All `@typescript-eslint/no-unused-vars` warnings are suppressed
For a health application handling sensitive medical data, this dramatically increases the risk of runtime type errors.
**Recommended action:** Enable `strict: true` incrementally. Start with `noImplicitAny: true`, then `strictNullChecks: true`, then enable the full strict mode. Add explicit type annotations as needed.

### 18. Widespread `as unknown` Type Escapes

**Severity:** HIGH
**Location:** Multiple files
- `src/components/ChatInterface.tsx:95,173,181,186,258,270`
- `src/pages/History.tsx:131`
- `src/pages/BrainGames.tsx:314,756`
**Description:** The codebase uses 9+ instances of `as unknown as Type` to force TypeScript to accept type-unsafe operations. This is a strong indicator that the type system is being bypassed rather than fixed. In `ChatInterface.tsx`, session messages are cast between `Json` and `Message[]` repeatedly without type guards.
**Recommended action:** Create proper type guards (e.g., `isMessageArray(value: Json): value is Message[]`) for JSON deserialization. Remove all `as unknown` casts by implementing proper type narrowing.

### 19. Only 4 Test Files for the Entire Application

**Severity:** HIGH
**Location:** Test files:
- `src/lib/password-strength.test.ts` (224 lines)
- `src/lib/storage.test.ts` (93 lines)
- `src/components/PasswordStrengthMeter.test.tsx` (160 lines)
- `src/pages/Dashboard.test.tsx` (215 lines)
**Description:** The application has only 4 test files covering a fraction of the codebase. Critically missing test coverage:
- `encryption.ts` — core encryption/decryption, key derivation, token rotation
- `offline-db.ts` — encryption mappers, sync logic, token refresh migration
- `cached-queries.ts` — cache invalidation flows
- `ChatInterface.tsx` — message sending, streaming response handling
- `Metrics.tsx` — offline metric recording and sync
- `History.tsx` — offline symptom sync
- `ProtectedRoute.tsx` — auth state handling
- All Supabase edge functions
**Recommended action:** Prioritize test coverage for `encryption.ts` and `offline-db.ts` given their critical role in data security and integrity. Aim for at least 60% coverage on business logic files.

### 20. Production `console.log` Statements with User Data

**Severity:** HIGH
**Location:** `src/pages/Profile.tsx:136,160,173` — `console.log("Current user:", user.id)`, `console.log("Saving profile data:", profileData)`, `console.log("Save successful:", result)`
**Description:** As noted under Security Concerns, the Profile page logs personally identifiable health information to the browser console. This is both a privacy violation and a code quality issue.
**Recommended action:** Remove all `console.log` statements. If logging is needed, use an environment-gated logger: `if (import.meta.env.DEV) { ... }`.

### 21. Error Handling Often Only Logs Without User Feedback

**Severity:** MEDIUM
**Location:** Multiple files — e.g., `src/lib/offline-db.ts:117,136,141,258`, `src/lib/cached-queries.ts:18,36`
**Description:** Many error handlers silently swallow errors with only `console.error`. In the offline database module, token rotation migration failures silently clear the local database (lines 136-143), and sync failures return `false` without notifying the user. Users may lose health data without any indication.
**Recommended action:** Surface critical errors (sync failures, encryption errors, data loss events) to users via toast notifications. Add a global error reporting mechanism.

### 22. Duplicate Edge Functions for Account Deletion

**Severity:** LOW
**Location:** 
- `supabase/functions/delete-account/index.ts`
- `supabase/functions/delete-user-account/index.ts`
**Description:** Two nearly identical edge functions exist for account deletion. Both use `SUPABASE_SERVICE_ROLE_KEY` to call `auth.admin.deleteUser()`. The `Settings.tsx` page calls `delete-user-account`. Having two functions means maintenance duplication and potential drift.
**Recommended action:** Remove the unused `delete-account` function and consolidate to `delete-user-account`.

---

## Maintainability Concerns

### 23. Duplicate Supabase Client Files with Confusing Names

**Severity:** LOW
**Location:**
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/supabaseClient.ts`
**Description:** Two Supabase client files exist with overlapping responsibilities. `supabaseClient.ts` validates environment variables and exports `supabaseUrl`/`supabasePublishableKey`. `client.ts` imports these to create the Supabase client. Some files import from `client.ts` (correct), others could theoretically import the wrong one. This split is confusing for new developers.
**Recommended action:** Consolidate into a single `client.ts` that both validates env vars and creates the client. Remove `supabaseClient.ts`.

### 24. No API Documentation for Edge Functions

**Severity:** LOW
**Location:** `supabase/functions/` — 6 edge functions
**Description:** The 6 Supabase edge functions (`symptom-analyzer`, `get-cached-data`, `invalidate-cache`, `delete-user-account`, `delete-account`, `broadcast-emergency`) lack API documentation. Request/response schemas, error codes, and authentication requirements are only documented in code comments. This makes debugging and future development harder.
**Recommended action:** Add OpenAPI 3.0 specs or at minimum a README in `supabase/functions/README.md` documenting each function's contract.

### 25. `space-separated-tokens` Package in Dependencies

**Severity:** LOW
**Location:** `package.json:71`
**Description:** The `space-separated-tokens` package (~unknown usage) is listed as a dependency. This is a low-level utility that was likely pulled in by another library and may be unused. It adds unnecessary dependency audit burden.
**Recommended action:** Check if this is a transitive dependency. If unused, remove it.

### 26. React Router v7 with v6-Style Patterns

**Severity:** LOW
**Location:** `package.json:68` — `react-router-dom: ^7.16.0`, `src/App.tsx:48-185`
**Description:** The project uses React Router v7 but follows v6 patterns (`<BrowserRouter>`, `<Routes>`, `<Route>` with `element` props). React Router v7 introduced new "loader" and "action" APIs, but these are not used. Future upgrades to React Router v7 full patterns (or v8) may require significant refactoring.
**Recommended action:** Stay on current patterns until migration is planned. When upgrading to React Router v7 data APIs, refactor route definitions to use loaders/actions for data fetching.

### 27. No Database Schema Diagram or Documentation

**Severity:** LOW
**Location:** `supabase/migrations/` — 7 migration files
**Description:** The database schema is defined across multiple migration files. There is no single schema overview, ER diagram, or data dictionary documenting the tables, relationships, and constraints. For a health data application, understanding the schema is critical for auditing.
**Recommended action:** Generate a schema documentation file (e.g., `supabase/SCHEMA.md`) from the migration files. Document each table, its purpose, RLS policies, and relationships.

### 28. Redis Credentials Configured via Env Vars Without Warning on Missing Config

**Severity:** LOW
**Location:** `supabase/functions/_shared/redis.ts:3-4`
**Description:** Redis (Upstash) URL and token are read from environment variables and silently skipped if missing. While the fallback to in-memory rate limiting works, there's no warning logged when Redis is unavailable, making it hard to diagnose cache misses in production.
**Recommended action:** Add a warning log when Redis credentials are missing. Consider adding a health check endpoint or startup diagnostic.

### 29. nginx Cache-Control Headers May Not Match PWA Requirements

**Severity:** LOW
**Location:** `nginx.conf:12-17`
**Description:** The nginx config caches static assets for 1 month (`expires 1M`). This may conflict with the PWA service worker's own caching strategy (`vite-plugin-pwa` with `autoUpdate`). Users may receive stale versions of the app if the service worker and HTTP cache have conflicting policies.
**Recommended action:** Set shorter cache durations for the HTML file (no-cache) and ensure the PWA service worker controls asset caching via `VitePWA`'s workbox configuration.

---

## Summary of Top Priority Concerns

| Priority | Concern | Severity | Area |
|----------|---------|----------|------|
| 1 | Encryption key stored in plain module variable | HIGH | Security |
| 2 | Auth token in localStorage for key derivation | HIGH | Security |
| 3 | `console.log` leaking health data | HIGH | Security/Quality |
| 4 | TypeScript strict mode disabled | HIGH | Quality |
| 5 | `as unknown` type escapes throughout codebase | HIGH | Quality |
| 6 | Only 4 test files for critical health app | HIGH | Quality |
| 7 | Offline sync has no conflict resolution | HIGH | Data Integrity |
| 8 | Missing CSP and security headers | MEDIUM | Security |
| 9 | `verify_jwt = false` for symptom-analyzer | MEDIUM | Security |
| 10 | No route-level code splitting | MEDIUM | Performance |

---

*Concerns audit: 2026-06-16*
