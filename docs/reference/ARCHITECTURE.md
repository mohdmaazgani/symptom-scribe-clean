# Architecture

## 1. Overview

Symptom Scribe is a health tracking and wellness SPA. Users log symptoms, track health metrics, chat with an AI health assistant, and earn gamification rewards. All personal health data is **client-side encrypted** before being stored in Supabase.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite + SWC |
| Styling | Tailwind CSS + Radix UI |
| Routing | React Router v6 |
| Server state | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Backend Platform | Supabase (Authentication, PostgreSQL, Edge Functions) |
| Offline storage | Dexie (IndexedDB) |
| Encryption | Web Crypto API (AES-GCM) |
| i18n | i18next + react-i18next |
| Testing | Vitest + Testing Library |
| PWA | vite-plugin-pwa |

---

## 3. High-Level Architecture

```
Browser
├── React SPA (Vite)
│   ├── Pages / Components
│   ├── TanStack Query (server state cache)
│   ├── Dexie (offline IndexedDB)
│   └── Web Crypto (client-side encryption)
│

└── Supabase
    ├── Auth (email/password, magic link)
    ├── Postgres + RLS
    ├── Edge Functions (Deno)
    │   ├── symptom-analyzer      ← AI analysis via external LLM
    │   ├── broadcast-emergency
    │   ├── get-cached-data
    │   ├── invalidate-cache
    │   ├── delete-account
    │   └── delete-user-account
    └── Redis (rate limiting via _shared/redis.ts)
```

The app has **no dedicated backend server**. All business logic runs either in the browser or in Supabase Edge Functions.

---

## 4. Architectural Principles

The project emphasizes:

- Separation of presentation and data access.
- Reusable application logic through custom hooks and shared utilities.
- Client-side encryption of sensitive information.
- Offline-first support using IndexedDB.
- Backend services provided through Supabase authentication, database, and Edge Functions.

---

## 5. Project Structure

```text
src/
├── components/          # Reusable UI components organized by feature
├── hooks/               # Custom React hooks for state management and data access
├── integrations/
│   └── supabase/        # Supabase client configuration and generated database types
├── lib/                 # Shared utilities (encryption, offline sync, caching, helpers, i18n)
├── pages/               # Route-level pages
└── test/                # Shared testing utilities
```

### Key Responsibilities

- **components/** contains reusable UI components grouped by feature.
- **hooks/** encapsulates reusable logic for data fetching, state management, and interactions with Supabase.
- **integrations/supabase/** centralizes Supabase client configuration and generated database types.
- **lib/** contains shared utilities such as encryption, offline synchronization, caching, and helper functions.
- **pages/** defines the application's route-level components.
- **test/** provides shared utilities used across the test suite.

> **Note:** The project currently does not use a dedicated global state management library. Data access is primarily coordinated through custom hooks and shared utility modules.

---

## 6. Frontend Architecture

**State management**

- No global state library. State is either:
  - **Server state** — TanStack Query (fetching, caching, invalidation)
  - **Local component state** — `useState` / `useReducer`
- There is no React Context for auth state — `ProtectedRoute` manages session independently via `supabase.auth.getSession()` + `onAuthStateChange`

**Routing**

- React Router v6 with lazy-loaded pages via `React.lazy` + `Suspense`
- Protected routes are wrapped with `<ProtectedRoute>` which redirects to `/auth` if no session exists
- Public routes: `/`, `/auth`, `/reset-password`, `/blog`, `/health-library`, `/contact`, legal pages

**Code splitting**

Every page is lazy-loaded. The `LoadingScreen` spinner in `App.tsx` is the Suspense fallback.

---

## 7. Authentication Flow

```
User visits protected route
        │
        ▼
ProtectedRoute
├── supabase.auth.getSession()   ← checks existing session
├── onAuthStateChange()          ← subscribes to session changes
│

├── loading → spinner
├── error   → error UI with retry
├── no session → <Navigate to="/auth" />
└── session → render children

On SIGNED_IN (App.tsx global listener)
├── offline synchronization process            ← flush Dexie pending queue to Supabase
└── if localStorage has pending profile:
    ├── encrypt PII fields with user's CryptoKey
    ├── supabase.from("profiles").upsert(...)
    └── clear localStorage entry
```

**Encryption keys** are derived per-user from their Supabase JWT access token via `encryption initialization` in `App.tsx`. Keys are held in memory only — never persisted.

---

## 8. Supabase Integration

**Database tables**

| Table | Purpose |
|---|---|
| `profiles` | User PII (encrypted), blood type, emergency contact |
| `symptom_history` | Logged symptoms + AI analysis results |
| `health_metrics` | Typed metric entries (weight, BP, sleep, etc.) |
| `chat_sessions` | AI chat history (messages stored as JSON) |

All tables have **Row Level Security (RLS)** enforced. Every migration in `supabase/migrations/` should be reviewed before applying.

**Edge Functions**

| Function | Responsibility |
|---|---|
| `symptom-analyzer` | Validates input, checks for emergency symptoms, calls LLM, rate-limits per user |
| `broadcast-emergency` | Sends emergency alerts |
| `get-cached-data` | Returns cached table data (Redis-backed) |
| `invalidate-cache` | Purges Redis cache for a given table |
| `delete-account` / `delete-user-account` | Cascade-deletes all user data |

**Caching Layer**

The application includes a caching abstraction for frequently accessed data to reduce unnecessary database requests and improve performance.

**Searchable Encrypted Data**

Searchable encrypted fields are accompanied by derived search metadata, allowing limited search functionality without exposing plaintext values.

---

## 9. Data Flow

**Online write**

```
Component → hook/lib → supabase.from(...) → Postgres (RLS enforced)
                                          → caching layer
```

**Offline write**

```
Component → hook/lib → Dexie (offline queue)
                     → on next SIGNED_IN / navigator.onLine
                     → offline synchronization process
                     → Supabase
```

**AI symptom analysis**

```
ChatInterface → symptom consultation utility → symptom-analyzer edge fn
                                        ├── rate limit check (Redis)
                                        ├── emergency symptom detection
                                        ├── LLM call
                                        └── response → stored in symptom_history
```

**Encrypted PII flow**

```
User input → encrypt sensitive value → encrypted string → Supabase
                                                    → generate search metadata → _search_tokens column
```

---

## 10. Feature Development Guide

### Adding a New Page

1. Create a page under `src/pages/`.
2. Register the route in `App.tsx`.
3. Wrap protected pages with `ProtectedRoute` when authentication is required.

### Adding Persistent Data

1. Create the required Supabase migration.
2. Configure appropriate Row Level Security (RLS) policies.
3. Regenerate the Supabase TypeScript types.
4. Add data access through existing hooks or shared utility modules.
5. Consider offline synchronization where applicable.

### Working with Sensitive Data

- Encrypt sensitive user information before storage.
- Avoid exposing sensitive information in logs.
- Follow the project's existing encryption workflow.

### Extending Existing Features

- Reuse existing hooks and shared utilities whenever possible.
- Keep UI components focused on presentation.
- Keep reusable logic outside UI components.

---

## 11. Best Practices

### Security

- Enable Row Level Security (RLS) for all new database tables.
- Encrypt sensitive user information before storage.
- Validate external input before processing it in Edge Functions.
- Avoid exposing privileged Supabase APIs to the client.

### Data Access

- Reuse existing hooks and shared utility modules for database operations.
- Keep Supabase interactions outside UI components whenever practical.
- Use TanStack Query to keep cached server state synchronized after mutations.

### Offline Support

- Consider offline behavior when introducing new user-generated data.
- Integrate new synchronization logic with the existing offline workflow.

### Maintainability

- Keep components focused on presentation.
- Prefer reusable hooks and shared utilities over duplicated logic.
- Update this document whenever architectural changes are introduced.