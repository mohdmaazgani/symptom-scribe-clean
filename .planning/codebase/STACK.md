# Technology Stack

**Analysis Date:** 2026-06-16

## Languages

**Primary:**
- **TypeScript** 5.8.3 — All application source code (`.ts`, `.tsx`) and Supabase Edge Functions (`.ts`)
- **CSS** — Tailwind CSS within `src/index.css` and component-level CSS files like `animated-theme-toggler.css`
- **SQL** — Seven migration files in `supabase/migrations/` using PostgreSQL dialect

**Secondary:**
- **HTML** — `index.html` entry point with meta tags, theme flash prevention script, and root mount point
- **Shell/Config** — Dockerfile (multi-stage), nginx.conf, .editorconfig, .prettierrc, .prettierignore

## Runtime

**Environment (Dev):**
- **Node.js** 20 (specified in `.nvmrc`: `20`)
- **Package Manager:** npm (lockfile: `package-lock.json`); also `bun.lockb` present
- Dev server port: 8080 (configured in `vite.config.ts`)

**Environment (Production):**
- **Node.js** 20-alpine (Docker build stage)
- **nginx** alpine (Docker runtime stage, serving static build artifacts)

## Frameworks

**Core Frontend:**
| Framework | Version | Purpose |
|-----------|---------|---------|
| React | 18.3.1 | UI component library with `react-dom` 18.3.1 |
| Vite | 5.4.19 | Dev server and production bundler |
| @vitejs/plugin-react-swc | 3.11.0 | SWC-based React fast-refresh plugin (faster than Babel) |
| TypeScript | 5.8.3 | Language compilation and type checking (two tsconfigs: app + node) |

**Routing:**
- **React Router DOM** 7.16.0 (formerly react-router-dom v7) — Client-side routing via `<BrowserRouter>`, `<Routes>`, `<Route>`, and `<Navigate>` for protected routing

**Data Fetching & State:**
- **TanStack React Query** 5.83.0 — Server-state management with `<QueryClientProvider>`, used for cached Supabase data queries with retry/gcTime config
- **React Context** — Custom hooks (`use-toast.ts`) use reducer + context pattern for toast notification state

**Form Handling:**
- **react-hook-form** 7.61.1 — Form state management in auth forms
- **@hookform/resolvers** 3.10.0 — Zod integration for react-hook-form
- **Zod** 3.25.76 — Schema validation for auth forms, password strength validation, and Edge Function request payloads (`supabase/functions/symptom-analyzer/validation.ts`)

**UI Components & Styling:**
| Library | Version | Purpose |
|---------|---------|---------|
| shadcn/ui | — (components.json) | Component system (style: "default", baseColor: "slate", CSS variables) |
| Radix UI (20 packages) | ^1.x | Accessible headless UI primitives (dialog, dropdown, tooltip, toast, sidebar, etc.) |
| Tailwind CSS | 3.4.17 | Utility-first CSS framework with `tailwindcss-animate` plugin and `@tailwindcss/typography` |
| PostCSS | 8.5.6 | CSS processing pipeline with `autoprefixer` |
| class-variance-authority | 0.7.1 | Component variant construction for shadcn/ui |
| clsx + tailwind-merge | 2.1.1 / 2.6.0 | Class name merging via `cn()` utility in `src/lib/utils.ts` |
| Framer Motion | 12.38.0 | Animation library in `src/components/AnimatedThemeToggler.tsx` and layout animations |
| next-themes | 0.3.0 | Theme provider with `class` attribute strategy, system preference detection |
| sonner | 1.7.4 | Toast notifications (alias `Toaster as Sonner` in `App.tsx`) |
| recharts | 2.15.4 | Charting library for health metrics visualization |
| lucide-react | 0.462.0 | Icon set throughout the UI |
| embla-carousel-react | 8.6.0 | Carousel component |
| react-countup | 6.5.3 | Animated number counters on Dashboard |
| react-day-picker | 8.10.1 | Date picker component |
| react-resizable-panels | 2.1.9 | Resizable panel layouts |
| react-markdown | 10.1.0 | Markdown rendering in chat responses |
| vaul | 0.9.9 | Drawer component |
| canvas-confetti | 1.9.4 | Confetti animations for gamification |
| cmdk | 1.1.1 | Command menu primitive |
| input-otp | 1.4.2 | OTP input component |
| date-fns | 3.6.0 | Date utility functions |
| html-to-image | 1.11.13 | HTML-to-image capture |

## Backend / API

**Supabase Suite:**
- **@supabase/supabase-js** 2.76.1 — Client library with auto-generated TypeScript types (`src/integrations/supabase/types.ts`) for database schema (4 tables: `profiles`, `symptom_history`, `health_metrics`, `chat_sessions`)
- **Supabase Edge Functions** — 6 Deno-based serverless functions in `supabase/functions/`:
  - `symptom-analyzer/` — AI symptom analysis, calls Lovable AI Gateway API
  - `get-cached-data/` — Redis/Upstash cache read
  - `invalidate-cache/` — Redis/Upstash cache invalidation
  - `broadcast-emergency/` — Twilio SMS emergency alerts
  - `delete-account/` — Account deletion
  - `delete-user-account/` — User account deletion
- **Supabase Auth** — Built-in auth with JWT sessions, `localStorage` persistence, `autoRefreshToken: true`

## Database

**Primary (PostgreSQL via Supabase):**
- **Postgres** managed by Supabase (migration files in `supabase/migrations/`)
- **Schema** (4 tables with RLS):
  - `profiles` — User profile data (name, DOB, blood type, allergies, chronic conditions, emergency contact, XP/level for gamification)
  - `symptom_history` — AI-analyzed symptom records (severity, causes, recommendations, risk score)
  - `health_metrics` — Tracked health metrics (blood pressure, heart rate, temperature, weight, blood sugar, oxygen saturation)
  - `chat_sessions` — AI chat conversation history with JSONB messages
- **Row Level Security** enabled on all tables
- **Foreign keys** with `ON DELETE CASCADE` to `auth.users`
- **Trigger** `on_auth_user_created` auto-creates profile on signup

**Client-Side (IndexedDB via Dexie):**
- **Dexie** 4.4.3 — Offline-first IndexedDB wrapper in `src/lib/offline-db.ts`
  - Database: `SymptomScribeOfflineDB` (version 1)
  - Table `healthMetrics` — Offline health metric records with sync status flags
  - Table `symptomHistory` — Offline symptom history records with sync status flags
  - Encrypted at rest using AES-GCM via the encryption layer

**Caching (Optional — Redis via Upstash):**
- **@upstash/redis** — Serverless Redis client used in Edge Functions (`supabase/functions/_shared/redis.ts`)
  - Configurable via `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env vars
  - Graceful fallback to in-memory if not configured
  - Used for: rate limiting and cache-aside pattern for Postgres queries

## Testing

| Tool | Version | Purpose |
|------|---------|---------|
| Vitest | 4.1.8 | Test runner (configured in `vite.config.ts`) |
| jsdom | 29.1.1 | DOM environment for React component tests |
| @testing-library/react | 16.3.2 | Component rendering utilities |
| @testing-library/jest-dom | 6.9.1 | Custom DOM matchers (e.g., `toBeInTheDocument`) |
| @testing-library/user-event | 14.6.1 | User interaction simulation |
| @types/jest | 30.0.0 | Type support for jest matchers |

**Configuration in `vite.config.ts`:**
- `environment: "jsdom"`, `globals: true`
- Setup file: `./src/test/setup.ts` (imports `@testing-library/jest-dom`)
- Coverage: v8 provider, includes `src/**/*.{ts,tsx}`, reporter: text + html

**Test files found:**
- `src/lib/storage.test.ts` — Storage utility unit tests
- `src/lib/password-strength.test.ts` — Password strength utility tests
- `src/components/PasswordStrengthMeter.test.tsx` — Component tests with user interactions
- `src/pages/Dashboard.test.tsx` — Dashboard page with mocked Supabase client

**Test Utilities:**
- `src/test/AllProviders.tsx` — Wraps tests with `QueryClientProvider` + `MemoryRouter`
- `src/test/utils.tsx` — Re-exports RTL with custom `render` wrapper (adds `AllProviders`)

## Build Tools & CI

**Development:**
- `npm run dev` — Vite dev server on port 8080
- `npm run build` — Vite production build
- `npm run build:dev` — Vite build in development mode

**Formatting & Linting:**
- **ESLint** 9.32.0 — Flat config (`eslint.config.js`), `typescript-eslint` v8, `eslint-plugin-react-hooks` v5, `eslint-plugin-react-refresh` v0.4
  - Rule: `@typescript-eslint/no-unused-vars`: off
  - Rule: `react-refresh/only-export-components`: warn
- **Prettier** 3.8.3 — Config: semicolons, double quotes, tabWidth 2, trailingComma es5, printWidth 100, LF line endings

**Docker:**
- **Dockerfile** — Multi-stage build: `node:20-alpine` to build, `nginx:alpine` to serve
  - Build: `npm ci` then `npm run build`
  - Serve: copies `dist/` to nginx html dir, applies custom `nginx.conf`
  - Exposes port 80
- **nginx.conf** — Serves SPA with `try_files $uri /index.html`, caches static assets for 1 month

**CI/CD:**
- `.github/` directory present (GitHub Actions)
- `public/_redirects` — SPA fallback for static hosting (`/* /index.html 200`)

## PWA Configuration

**Library:** `vite-plugin-pwa` 1.3.0 (configured in `vite.config.ts`)

**Settings:**
- `registerType: "autoUpdate"` — Service worker auto-updates on new version
- `includeAssets: ["favicon.svg", "apple-touch-icon-180x180.png", "maskable-icon-512x512.png"]`
- **Manifest:**
  - Name: "Symptom Scribe", short_name: "Symptom Scribe"
  - Description: "AI-powered symptom checker and health tracker."
  - Theme color: `#22d3ee`, Background: `#0f172a`
  - Display: `standalone`, start_url: `/`
  - Icons: 64x64, 192x192, 512x512 PNG + 512x512 maskable
- **Workbox** (service worker generation):
  - `globPatterns: ["**/*.{js,css,html,ico,png,svg}"]`
  - `navigateFallback: "/index.html"` — Enables offline SPA routing
- **PWA asset generator** (`@vite-pwa/assets-generator` 1.0.2) as dev dependency

**Apple touch:**
- `apple-touch-icon-180x180.png` in `public/`
- HTML meta: `apple-mobile-web-app-capable: yes`, `apple-mobile-web-app-status-bar-style: default`

## Third-Party Services

| Service | Purpose | Integration Point |
|---------|---------|------------------|
| **Supabase** | Database, Auth, Edge Functions | `@supabase/supabase-js` client in `src/integrations/supabase/client.ts` |
| **Lovable AI Gateway** | AI symptom analysis (uses `google/gemini-2.5-flash` model) | Called from `supabase/functions/symptom-analyzer/index.ts` via `LOVABLE_API_KEY` |
| **Twilio** | Emergency SMS alerts | Called from `supabase/functions/broadcast-emergency/index.ts` via Twilio API |
| **Upstash Redis** | Distributed rate limiting + query caching | `supabase/functions/_shared/redis.ts` (optional, fallback to in-memory) |
| **Vercel** | Production hosting (CORS origin `https://symptom-scribe.vercel.app`) | Configured in Edge Functions' `ALLOWED_ORIGINS` |

## Environment Configuration

**Browser (Vite):**
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/publishable key
- `VITE_SUPABASE_ANON_KEY` — Legacy fallback key (deprecated)

**Edge Function secrets** (configured via Supabase Dashboard, not in `.env.local`):
- `LOVABLE_API_KEY` — Required for symptom analysis AI gateway
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — Supabase admin
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — Optional Redis
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` — Emergency SMS
- `WEBHOOK_SECRET` — Optional webhook cache invalidation secret

---

*Stack analysis: 2026-06-16*
