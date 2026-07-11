# Symptom Scribe

Smart health tracking, AI-assisted symptom guidance, wellness metrics, and interactive learning in one modern web platform.

[Live Demo](https://symptom-scribe-clean.netlify.app/) | [Repository](https://github.com/mohdmaazgani/symptom-scribe-clean)

---

## Overview

Symptom Scribe is a full-stack MedTech and wellness application built to help users record health signals, understand symptoms, review personal history, and build healthier habits through guided insights and gamified experiences.

The platform combines a React dashboard, Supabase authentication and database services, serverless edge functions, AI-powered symptom analysis, emergency workflows, and educational health content.

> Medical disclaimer: Symptom Scribe is designed for wellness support and informational guidance only. It does not replace professional medical diagnosis, treatment, or emergency care.

---

## Key Features

- AI-assisted symptom analysis with safety-aware recommendations
- Secure user authentication with Supabase Auth
- Personal health dashboard for metrics, history, and wellness tracking
- Health facts, medical learning content, and educational resources
- Brain games and gamification features for engagement
- Emergency assistance flow with optional SMS support
- Profile, settings, legal, privacy, and accessibility pages
- Password strength validation during registration
- Offline-friendly local storage helpers
- Supabase Row Level Security and database migrations
- Responsive UI built with React, Tailwind CSS, and shadcn/ui-style components

---

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React 18, Vite, TypeScript |
| Styling | Tailwind CSS, Radix UI, shadcn/ui-style components |
| State/Data | TanStack Query, React Hook Form, Zod |
| Backend | Supabase |
| Database | PostgreSQL through Supabase |
| Authentication | Supabase Auth |
| Serverless | Supabase Edge Functions |
| AI Integration | Edge-function based AI symptom analyzer |
| Testing | Vitest, Testing Library |
| Deployment | Netlify |

---

## App Modules

- Home: product entry point and core value proposition
- Auth: sign up, login, reset password, protected route handling
- Dashboard: health overview and user activity
- Metrics: personal health metrics and progress views
- History: saved symptom and activity records
- Chat: conversational health assistant interface
- Health: AI assistant, health library, health facts, and emergency guide
- Games: cognitive and engagement-focused brain games
- Profile and Settings: user account management
- Legal: privacy, terms, disclaimer, and accessibility pages

---

## Project Structure

```text
symptom-scribe-clean/
+-- docs/
|   +-- guides/
|   |   +-- CONTRIBUTING.md
|   |   +-- PASSWORD_STRENGTH_FEATURE.md
|   |   +-- TROUBLESHOOT.md
|   +-- reference/
|       +-- CHANGELOG.md
|       +-- FAQ.md
|       +-- SECURITY.md
+-- public/
|   +-- favicon.svg
|   +-- pwa-192x192.png
|   +-- pwa-512x512.png
+-- src/
|   +-- components/
|   |   +-- auth/
|   |   +-- chat/
|   |   +-- common/
|   |   +-- diagnostics/
|   |   +-- hero/
|   |   +-- layout/
|   |   +-- legal/
|   |   +-- navigation/
|   |   +-- registration/
|   |   +-- theme/
|   |   +-- ui/
|   +-- data/
|   +-- hooks/
|   +-- integrations/
|   |   +-- supabase/
|   +-- lib/
|   +-- pages/
|   |   +-- Auth/
|   |   +-- Blog/
|   |   +-- Chat/
|   |   +-- Contact/
|   |   +-- Dashboard/
|   |   +-- Games/
|   |   +-- Health/
|   |   +-- History/
|   |   +-- Home/
|   |   +-- Legal/
|   |   +-- Metrics/
|   |   +-- Profile/
|   |   +-- User/
|   +-- test/
+-- supabase/
|   +-- functions/
|   |   +-- broadcast-emergency/
|   |   +-- delete-account/
|   |   +-- delete-user-account/
|   |   +-- get-cached-data/
|   |   +-- invalidate-cache/
|   |   +-- symptom-analyzer/
|   +-- migrations/
|   +-- config.toml
+-- Dockerfile
+-- nginx.conf
+-- package.json
+-- tailwind.config.ts
+-- tsconfig.json
+-- vite.config.ts
```

---

## Getting Started

### Prerequisites

- Node.js 20 or compatible LTS version
- npm
- Supabase account and project
- Supabase CLI for database migrations and edge functions

### 1. Clone the repository

```bash
git clone https://github.com/mohdmaazgani/symptom-scribe-clean.git
cd symptom-scribe-clean
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

Add your frontend Supabase values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

`VITE_SUPABASE_ANON_KEY` is supported only as a legacy fallback. Prefer `VITE_SUPABASE_PUBLISHABLE_KEY` for new setups.

### 4. Link Supabase and apply migrations

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

### 5. Start the development server

```bash
npm run dev
```

Open the app at the local URL printed by Vite, usually:

```text
http://localhost:8080
```

---

## Environment Variables

### Browser variables

These are loaded by Vite and are safe for frontend use.

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Browser-safe Supabase key |
| `VITE_SUPABASE_ANON_KEY` | No | Legacy fallback key |

### Edge function secrets

Do not place these in `.env.local`. Configure them in Supabase Dashboard or with `supabase secrets set`.

| Secret | Required | Purpose |
| --- | --- | --- |
| `LOVABLE_API_KEY` | Yes | AI gateway key for symptom analysis |
| `SUPABASE_URL` | Usually injected | Supabase project URL for functions |
| `SUPABASE_ANON_KEY` | Usually injected | Request/auth validation |
| `SUPABASE_SERVICE_ROLE_KEY` | For admin flows | Admin-only account deletion and service tasks |
| `TWILIO_ACCOUNT_SID` | For SMS alerts | Twilio account identifier |
| `TWILIO_AUTH_TOKEN` | For SMS alerts | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | For SMS alerts | Sender phone number |
| `UPSTASH_REDIS_REST_URL` | Optional | Distributed rate limiting/cache |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Upstash REST token |
| `WEBHOOK_SECRET` | Optional | Webhook-protected cache invalidation |

---

## Supabase Edge Functions

Available functions:

- `symptom-analyzer`
- `broadcast-emergency`
- `get-cached-data`
- `invalidate-cache`
- `delete-account`
- `delete-user-account`

Set secrets:

```bash
npx supabase secrets set LOVABLE_API_KEY=<your-ai-key>
npx supabase secrets set TWILIO_ACCOUNT_SID=<sid> TWILIO_AUTH_TOKEN=<token> TWILIO_PHONE_NUMBER=<phone>
npx supabase secrets set UPSTASH_REDIS_REST_URL=<url> UPSTASH_REDIS_REST_TOKEN=<token>
npx supabase secrets set WEBHOOK_SECRET=<secret>
```

Deploy functions:

```bash
npx supabase functions deploy symptom-analyzer
npx supabase functions deploy broadcast-emergency
npx supabase functions deploy get-cached-data
npx supabase functions deploy invalidate-cache
npx supabase functions deploy delete-account
npx supabase functions deploy delete-user-account
```

Serve functions locally:

```bash
npx supabase functions serve --env-file supabase/.env.local
```

---

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start local development server |
| `npm run build` | Create production build |
| `npm run build:dev` | Create development-mode build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format files with Prettier |
| `npm run format:check` | Check formatting |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |

---

## Testing

Run the test suite:

```bash
npm run test
```

Run lint checks:

```bash
npm run lint
```

Build production assets:

```bash
npm run build
```

---

## Deployment

The app is deployed as a Vite frontend and uses Supabase for backend services.

### Netlify

Recommended settings:

```text
Build command: npm run build
Publish directory: dist
```

Add these environment variables in Netlify:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

### Supabase

Before production use:

```bash
npx supabase db push
npx supabase functions deploy symptom-analyzer
npx supabase functions deploy broadcast-emergency
npx supabase functions deploy get-cached-data
npx supabase functions deploy invalidate-cache
npx supabase functions deploy delete-account
npx supabase functions deploy delete-user-account
```

Make sure all required edge-function secrets are configured before deploying functions.

---

## Security Notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code.
- Keep only `VITE_*` variables in browser-loaded environment files.
- Use Supabase Row Level Security policies for user-owned data.
- Keep API keys and webhook secrets in Supabase function secrets.
- Do not commit `.env.local` or private credential files.
- Review `docs/reference/SECURITY.md` for security guidance.

---

## Screenshots

Add screenshots inside a `screenshots/` folder and reference them like this:

```md
![Dashboard](screenshots/dashboard.png)
![Symptom Analyzer](screenshots/symptom-analyzer.png)
![Metrics](screenshots/metrics.png)
![Brain Games](screenshots/brain-games.png)
```

Suggested screenshots:

- Home page
- Dashboard
- AI health assistant
- Metrics page
- Symptom history
- Brain games
- Mobile responsive view

---

## Troubleshooting

### Environment variables are undefined

Confirm that browser variables start with `VITE_` and that the dev server was restarted after editing `.env.local`.

### Supabase login or data saving fails

Check:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- Supabase Auth settings
- Database migrations
- Row Level Security policies

### Edge function returns an error

Check:

- Required secrets are configured in Supabase
- The function is deployed
- The local function server uses the right env file
- Supabase project is linked with the correct project ref

### Build fails

Run:

```bash
npm install
npm run lint
npm run test
npm run build
```

Fix TypeScript, lint, or missing environment issues reported by the command output.

---

## Roadmap

- Wearable device integrations
- Medication reminders
- More advanced health analytics
- Doctor-patient collaboration workflows
- Personalized wellness forecasting
- Expanded symptom safety checks
- Multi-language health content

---

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make a focused change.
4. Run tests and lint checks.
5. Commit your work.
6. Open a pull request.

Pull request checklist:

- [ ] The change is tested locally
- [ ] No unrelated files are included
- [ ] Lint and formatting pass
- [ ] Environment changes are documented
- [ ] Any linked issue is referenced

See `docs/guides/CONTRIBUTING.md` for more details.

---

## License

This project is licensed under the MIT License.

---

## Author

Developed by [@mohdmaazgani](https://github.com/mohdmaazgani).

Built with a focus on accessible, intelligent, and user-friendly digital health experiences.
