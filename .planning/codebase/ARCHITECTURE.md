# Architecture

**Analysis Date:** 2026-06-16

## Pattern Overview

**Overall:** Single-Page Application (SPA) with server-rendered public pages and client-side routing for authenticated app views. Follows a **screen/page-based architecture** with a shared authenticated shell (`Layout` + `AppSidebar`).

**Key Characteristics:**
- **React 18** + TypeScript SPA, bootstrapped with Vite 5
- **React Router v7** (`react-router-dom@^7.16.0`) for all routing: `BrowserRouter` with `<Routes>`/`<Route>`
- **TanStack Query v5** (`@tanstack/react-query`) managing server-state cache layer
- **Supabase** as backend-as-a-service (auth, PostgreSQL database, Edge Functions, real-time subscriptions)
- **Dexie.js** (IndexedDB wrapper) for offline-first client-side data storage
- **Client-side AES-GCM encryption** for offline health records, key derived from the Supabase auth token via PBKDF2
- **Feature-driven pages** under `src/pages/` — each file is a self-contained screen

```
┌──────────────────────────────────────────────────────────────┐
│                     Browser (Vite SPA)                       │
│                                                              │
│  ┌─────────────┐   ┌──────────────────────────────────────┐  │
│  │  main.tsx   │──▶│  ThemeProvider → ErrorBoundary → App  │  │
│  │  (entry)    │   └──────────┬───────────────────────────┘  │
│  └─────────────┘              │                              │
│                               ▼                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    App.tsx                             │  │
│  │  ┌────────────┐ ┌──────────┐ ┌─────────────────────┐   │  │
│  │  │QueryClient │ │TooltipPr.│ │   BrowserRouter     │   │  │
│  │  │  Provider  │ │ Provider │ │  ┌───────────────┐  │   │  │
│  │  └────────────┘ └──────────┘ │  │ ScrollToTop   │  │   │  │
│  │                              │  │ ┌───────────┐ │  │   │  │
│  │                              │  │ │  Routes   │ │  │   │  │
│  │                              │  │ └───────────┘ │  │   │  │
│  │                              │  └───────────────┘  │   │  │
│  │                              └─────────────────────┘   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Route Resolution                           │  │
│  │  ┌──────────────┐    ┌─────────────────────────────┐   │  │
│  │  │  Public Routes│    │  Protected Routes           │   │  │
│  │  │  ─ /         │    │  ─ /dashboard               │   │  │
│  │  │  ─ /auth     │    │  ─ /chat                    │   │  │
│  │  │  ─ /privacy  │───▶│  ─ /metrics                 │   │  │
│  │  │  ─ /terms    │    │  ─ /history                 │   │  │
│  │  │  ─ /blog/*   │    │  ─ /profile                 │   │  │
│  │  │  ─ /contact  │    │  ─ /settings                │   │  │
│  │  │  ─ /* (404)  │    │  ─ /emergency               │   │  │
│  │  └──────────────┘    │  ─ /brain-games              │   │  │
│  │                      │  ─ /health-facts             │   │  │
│  │                      │  ─ /ai-health-assistant      │   │  │
│  │                      └─────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │           Protected Page Shell                          │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  ProtectedRoute (session check → redirect to     │  │  │
│  │  │    /auth if no session, loading spinner while     │  │  │
│  │  │    checking, error state if auth fails)            │  │  │
│  │  │  ┌────────────────────────────────────────────┐  │  │  │
│  │  │  │  Layout (SidebarProvider)                   │  │  │  │
│  │  │  │  ┌──────────────────────────────────────┐  │  │  │  │
│  │  │  │  │  Header (Health Tracker, Theme       │  │  │  │  │
│  │  │  │  │  Toggler, mobile SidebarTrigger)     │  │  │  │  │
│  │  │  │  ├──────────────────────────────────────┤  │  │  │  │
│  │  │  │  │  <main> Page Content </main>          │  │  │  │  │
│  │  │  │  ├──────────────────────────────────────┤  │  │  │  │
│  │  │  │  │  BackToTop                           │  │  │  │  │
│  │  │  │  └──────────────────────────────────────┘  │  │  │  │
│  │  │  └────────────────────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │            Data & State Layer                           │  │
│  │  ┌───────────┐  ┌───────────┐  ┌────────────────────┐  │  │
│  │  │ TanStack  │  │ Dexie/    │  │ Encryption (AES-   │  │  │
│  │  │ Query     │  │ IndexedDB  │  │ GCM via WebCrypto) │  │  │
│  │  │ (network) │  │ (offline) │  │                    │  │  │
│  │  └─────┬─────┘  └─────┬─────┘  └────────┬───────────┘  │  │
│  │        └──────┬───────┘                  │              │  │
│  │               ▼                          ▼              │  │
│  │        ┌────────────────────────────────────────┐      │  │
│  │        │         Supabase Client                 │      │  │
│  │        │  ─ Auth (localStorage session)          │      │  │
│  │        │  ─ Database (profiles, health_metrics,  │      │  │
│  │        │     symptom_history, chat_sessions)     │      │  │
│  │        │  ─ Edge Functions (symptom-analyzer,    │      │  │
│  │        │     broadcast-emergency, get/invalidate │      │  │
│  │        │     -cache, delete-user-account)        │      │  │
│  │        └────────────────────────────────────────┘      │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Layers

### `main.tsx` — Application Entry Point
- **Purpose:** Root-level environment validation and rendering
- **Location:** `src/main.tsx`
- **Flow:**
  1. Validates `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` via `browserEnv` diagnostics
  2. If invalid → renders `<StartupDiagnostics />` (error page showing missing vars)
  3. If valid → async imports `App.tsx` (code-splitting at entry)
  4. Wraps `<App />` in `<ErrorBoundary>` + `<ThemeProvider>`
- **Key behavior:** Imports `App.tsx` dynamically (`void import(...)`) so that config errors never run app code

### `App.tsx` — Root Component
- **Purpose:** Global providers, router setup, encryption initialization
- **Location:** `src/App.tsx`
- **Contains:**
  - `QueryClientProvider` (TanStack Query)
  - `TooltipProvider` (Radix UI)
  - `Toaster` (Radix Toast) + `Sonner` toast component
  - `BrowserRouter` wrapping `ScrollToTop` + `Routes`
  - Encryption initialization via `useEffect` → `initializeEncryption()`
- **Depends on:** `@tanstack/react-query`, `react-router-dom`, `@/lib/encryption`

### Pages Layer — `src/pages/`
- **Purpose:** Each `.tsx` file represents one full page/screen
- **Location:** `src/pages/`
- **Contains:** 19 page components
- **Depends on:** Components from `src/components/`, Supabase client, hooks, lib utilities
- **Used by:** `App.tsx` route definitions

### Components Layer — `src/components/`
- **Purpose:** Reusable UI building blocks
- **Location:** `src/components/`
- **Sub-layers:**
  - `src/components/ui/` — 50+ shadcn/ui primitives (Button, Card, Dialog, etc.) — generated/imported from shadcn registry
  - `src/components/legal/` — `LegalPageLayout`, `Section`, `PageFooter` — reusable legal page template
  - `src/components/registration/` — `MultiStepSignUp` — 5-step multi-form registration
  - Top-level: `Layout`, `AppSidebar`, `ProtectedRoute`, `ChatInterface`, `ChatMessage`, `ChatLoading`, `Hero`, `ErrorBoundary`, `ThemeProvider`, `BackToTop`, `ScrollToTop`, `AnimatedThemeToggler`, `PasswordStrengthMeter`, `StartupDiagnostics`

### Lib Layer — `src/lib/`
- **Purpose:** Business logic, utilities, storage abstractions, encryption
- **Location:** `src/lib/`
- **Contains:**
  - `env.ts` — browser environment variable parsing and validation
  - `encryption.ts` — AES-GCM key derivation from Supabase token, encrypt/decrypt, session lifecycle hooks
  - `offline-db.ts` — Dexie IndexedDB schema, encrypt/decrypt mappers, sync orchestration (`syncOfflineData`)
  - `cached-queries.ts` — Supabase Edge Function invocations for Redis-cached data
  - `storage.ts` — localStorage/sessionStorage helpers with TTL, validation, size checking
  - `utils.ts` — Tailwind `cn()` utility, secure random helpers, Fisher-Yates shuffle
  - `toast-helpers.ts` — typed wrappers around `useToast` (showSuccess, showError, showWarning, showInfo, showLoading)
  - `password-strength.ts` — password policy evaluation, strength scoring, generation
  - `password-policy-config.ts` — policy configuration constants
- **Used by:** All pages and components

### Integration Layer — `src/integrations/supabase/`
- **Purpose:** Supabase client initialization and TypeScript types
- **Location:** `src/integrations/supabase/`
- **Contains:**
  - `client.ts` — auto-generated Supabase client with `createClient<Database>(...)`
  - `supabaseClient.ts` — exports `supabaseUrl` and `supabasePublishableKey` from `browserEnv`
  - `types.ts` — auto-generated TypeScript types from Supabase schema
- **Depends on:** `@supabase/supabase-js`, `@/lib/env`

### Hooks Layer — `src/hooks/`
- **Purpose:** Custom React hooks
- **Location:** `src/hooks/`
- **Contains:**
  - `useMetricsHistory.ts` — fetches health metrics from cached queries + Dexie with encryption, provides CRUD
  - `use-toast.ts` — toast state management via reducer pattern (used by shadcn/ui toast)
  - `use-mobile.tsx` — responsive mobile detection via `matchMedia`

## Data Flow

### Online Data Flow (React Query → Supabase)

```
User Action → Page Component
  → supabase.from("table").select/insert/update/delete()
  → Response stored in local state (useState/useEffect)
  → UI renders from local state
  
Cache Invalidation:
  Mutation success → invalidateCache("table_name")
    → invokes Supabase Edge Function "invalidate-cache"
    → Redis cache cleared for current user + table
  
Read Optimization:
  Page mounts → getCachedData<Type>("table_name")
    → invokes Supabase Edge Function "get-cached-data"
    → Returns Redis-cached data if available, or fresh DB query
```

### Offline-First Data Flow (Dexie/IndexedDB)

```
WRITE PATH:
User submits data → encryptMetric() / encryptSymptom() with CryptoKey
  → if offline: save to IndexedDB with pending_sync=1
  → if online: save to Supabase, invalidate cache, also save to IndexedDB with pending_sync=0

READ PATH:
Page loads → check navigator.onLine
  → if online: fetch from cached Edge Function → decrypt → bulkPut to IndexedDB → read from IndexedDB
  → if offline: read directly from IndexedDB → decrypt → display

SYNC PATH (syncOfflineData):
  Called on navigator.online event + on page mount in Metrics/History pages
  1. Delete pending: health_metrics & symptom_history with pending_delete=1 → Supabase DELETE
  2. Insert pending: records with pending_sync=1 → decrypt → Supabase INSERT → set pending_sync=0
  3. Update pending: records with pending_update=1 → Supabase UPDATE → set pending_update=0
  4. On success: invalidateCache for both tables
```

### Encryption Data Flow

```
Supabase Auth Token
  → deriveKeyFromToken(access_token) → PBKDF2 (100k iterations, SHA-256) → AES-GCM-256 key
  → stored in module-level activeKey variable
  
On auth state change:
  → initializeEncryption() in App.tsx useEffect
  → handleSessionChange: derive new key from token
  → If token rotated: onTokenRefreshCallback(oldKey, newKey) re-encrypts all IndexedDB data
  → On logout: handleSessionClear → setKey(null) → onLogoutCallback clears IndexedDB

Components call whenEncryptionReady() to get the key before reading/writing offline data
```

## Routing Architecture

**File:** `src/App.tsx`

**Router:** `BrowserRouter` from `react-router-dom` v7

**Route structure:**

| Path | Component | Auth | Layout | Category |
|------|-----------|------|--------|----------|
| `/` | `Index` | Public | None (standalone) | Landing |
| `/auth` | `Auth` | Public | None | Auth |
| `/reset-password` | `ResetPassword` | Public (recovery) | None | Auth |
| `/dashboard` | `Dashboard` | Protected | `Layout` | App |
| `/chat` | `Chat` | Protected | `Layout` | App |
| `/metrics` | `Metrics` | Protected | `Layout` | App |
| `/history` | `History` | Protected | `Layout` | App |
| `/profile` | `Profile` | Protected | `Layout` | App |
| `/emergency` | `Emergency` | Protected | `Layout` | App |
| `/brain-games` | `BrainGames` | Protected | `Layout` | App |
| `/health-facts` | `HealthFacts` | Protected | `Layout` | App |
| `/settings` | `Settings` | Protected | `Layout` | App |
| `/ai-health-assistant` | `AIHealthAssistant` | Protected | `Layout` | App |
| `/privacy` | `Privacy` | Public | None | Legal |
| `/terms` | `Terms` | Public | None | Legal |
| `/disclaimer` | `Disclaimer` | Public | None | Legal |
| `/accessibility` | `Accessibility` | Public | None | Legal |
| `/health-library` | `HealthLibrary` | Public | None | Content |
| `/blog` | `Blog` | Public | None | Content |
| `/blog/:slug` | `BlogPostPage` | Public | None | Content |
| `/contact` | `Contact` | Public | None | Content |
| `*` | `NotFound` | Public | None | Error |

**Pattern for protected routes:**
```tsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Layout>
        <Dashboard />
      </Layout>
    </ProtectedRoute>
  }
/>
```

## Authentication Flow

### ProtectedRoute (`src/components/ProtectedRoute.tsx`)
- **States:** loading → session check → render or redirect
- Uses `supabase.auth.getSession()` on mount
- Listens to `onAuthStateChange` for real-time session updates
- Shows `<Loader2 />` spinner during loading
- Shows error UI with retry button on auth error
- Redirects to `/auth` if no session found via `<Navigate to="/auth" replace />`

### Auth Page (`src/pages/Auth.tsx`)
- Tab-based UI: Sign In / Sign Up (via `MultiStepSignUp`)
- Sign in: `supabase.auth.signInWithPassword()` with Zod validation
- Password reset: `supabase.auth.resetPasswordForEmail()` → redirects to `/reset-password`
- On auth state change with session → auto-navigates to `/dashboard`
- Uses `MultiStepSignUp` component for 5-step registration (Account → Personal → Health → Emergency → Review)

### Reset Password (`src/pages/ResetPassword.tsx`)
- Simple form accepting new password
- Calls `supabase.auth.updateUser({ password })`
- On success navigates to `/auth`

## State Management

**No global state management library** (no Redux, Zustand, or Context for app state).

The app uses a **composable approach**:

| State Type | Mechanism | Examples |
|---|---|---|
| **Server data** | Local `useState` + `useEffect` fetching directly from Supabase | Dashboard stats, chat sessions, symptom history |
| **Offline data** | `useState` + `useEffect` reading from Dexie IndexedDB | Metrics history, symptom history |
| **Auth state** | Supabase `onAuthStateChange` listener | Session in ProtectedRoute, encryption key derived from token |
| **UI state** | Local component `useState` | Form inputs, loading flags, modals, toggles |
| **Theme** | `next-themes` ThemeProvider with `class` strategy | Dark/light toggle |
| **Toast** | Reducer pattern in `use-toast.ts` with global listener array | Toast notifications |
| **Sidebar** | `shadcn/ui` SidebarProvider with context | Open/close/collapse state |

## Offline/Online Sync Patterns

**Pattern:** **Online-first with offline fallback**

Key files:
- `src/lib/offline-db.ts` — Dexie schema + encrypt/decrypt mappers + `syncOfflineData()`
- `src/hooks/useMetricsHistory.ts` — health metrics CRUD with offline flag via `pending_sync`, `pending_delete`

**Tables replicated offline:**
- `health_metrics` → Dexie table `OfflineMetric`
- `symptom_history` → Dexie table `OfflineSymptom`

**Sync fields on offline records:**
- `pending_sync: 0 | 1` — needs insert to server
- `pending_delete: 0 | 1` — needs delete from server
- `pending_update: 0 | 1` — needs update on server (symptom_history only)

**Online event handler (in History.tsx and Metrics.tsx):**
```tsx
useEffect(() => {
  const handleOnline = async () => {
    setIsOnline(true);
    const synced = await syncOfflineData();
    if (synced) fetchHistory(); // or refresh()
  };
  window.addEventListener("online", handleOnline);
  return () => window.removeEventListener("online", handleOnline);
}, []);
```

## Error Handling Strategy

### ErrorBoundary (`src/components/ErrorBoundary.tsx`)
- Class-based React error boundary wrapping the entire app in `main.tsx`
- Catches render errors, logs to console
- Displays "Something went wrong" fallback UI with **Reload Application** button

### ProtectedRoute Error Handling
- Catches auth session errors
- Shows error message with retry button
- Redirects to `/auth` if no session

### Page-Level Error Handling
- **Try/catch** in every async operation (Supabase queries, Edge Function calls)
- **Toast notifications** for user-facing errors via `showError()`, `showWarning()`
- **Console.error()** for debugging
- **Loading states** via boolean flags (`loading`, `saving`, etc.)

### Startup Diagnostics (`src/components/StartupDiagnostics.tsx`)
- Shown when required environment variables are missing
- Lists missing variables and provides instructions
- Includes reload button

### App Load Error (`src/main.tsx`)
- Catch handler for dynamic `import("./App.tsx")` failure
- Shows "Unable to load the app" fallback

## Key Design Patterns

### 1. Component Composition for Protected Routes
```tsx
<ProtectedRoute>
  <Layout>
    <PageContent />
  </Layout>
</ProtectedRoute>
```
Three wrappers: auth guard → app shell → page content. Each wrapper can be independently replaced or tested.

### 2. Offline-First Repository Pattern
Pages access data through a unified pattern:
```tsx
// In useMetricsHistory hook:
if (navigator.onLine) {
  // 1. Fetch from Supabase via cached query
  const { data } = await getCachedData("health_metrics");
  // 2. Persist locally with encryption
  await db.healthMetrics.bulkPut(encryptedEntries);
}
// 3. Always read from local Dexie (decrypted)
const localRecords = await db.healthMetrics.where("user_id").equals(userId).toArray();
const decrypted = await Promise.all(localRecords.map(r => decryptMetric(r, key)));
```

### 3. Encryption Hook Registration
The encryption module exposes `registerEncryptionHooks()` that `offline-db.ts` calls to register `onLogout` and `onTokenRefresh` callbacks. This decouples encryption logic from offline storage logic.

### 4. Toast Helpers Wrapper
`src/lib/toast-helpers.ts` provides typed helper functions (`showSuccess`, `showError`, `showWarning`, `showInfo`, `showLoading`) that wrap the `useToast` hook for consistent UX.

### 5. Legal Page Template
`LegalPageLayout` + `Section` components provide a shared layout for all legal pages (Privacy, Terms, Disclaimer, Accessibility), ensuring consistent header, navigation, and spacing.

### 6. Multi-Step Registration
`MultiStepSignUp` uses framer-motion `<AnimatePresence>` + `<motion.div>` for step transitions across 5 steps with field validation, password strength, and conditional rendering.

### 7. Confirm-Before-Action Pattern
Used extensively for destructive actions:
- `AlertDialog` wrapping delete buttons in Chat, Metrics, History, and Settings
- `AlertDialog` wrapping sign-out in AppSidebar

---

*Architecture analysis: 2026-06-16*
