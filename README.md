# 🩺 Symptom Scribe — Smart Health & MedTech Platform

Symptom Scribe is an AI-powered health and wellness platform designed to help users track health metrics, analyze symptoms, receive personalized recommendations, and improve overall well-being through intelligent insights and interactive experiences.

🌐 **Live Demo:** https://symptom-scribe-clean.netlify.app/

---

# 📑 Table of Contents

- [Project Overview](#-project-overview)
- [Objectives](#-objectives)
- [Key Features](#-key-features)
- [Technology Stack](#%EF%B8%8F-technology-stack)
- [Screenshots](#-screenshots)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Supabase Edge Function Setup](#%EF%B8%8F-supabase-edge-function-setup)
- [API & Backend Services](#-api--backend-services)
- [Project Structure](#-project-structure)
- [Usage Guide](#-usage-guide)
- [Troubleshooting](#%EF%B8%8F-troubleshooting)
- [FAQ](#-faq)
- [Contributing](#-contributing)
- [Future Enhancements](#-future-enhancements)
- [License](#-license)
- [Author](#%E2%80%8D-author)

---

# 📖 Project Overview

Symptom Scribe provides a centralized health management experience that combines:

* Health tracking
* Symptom analysis
* AI-powered recommendations
* Brain-training activities
* Medical education
* Doctor consultation guidance

The goal is to make healthcare monitoring more accessible, engaging, and personalized.

---

# 🎯 Objectives

* Help users monitor daily health metrics.
* Enable symptom tracking and analysis.
* Provide educational health insights.
* Encourage healthier lifestyles through gamification.
* Support informed healthcare decisions.

---

# 🌟 Key Features

## 🧠 Health & Wellness Tracking

* Track hydration, nutrition, activity levels, and wellness goals.
* View health progress over time.
* Personalized wellness recommendations.

## 🩻 Symptom Analysis

* Log and manage symptoms.
* AI-assisted symptom evaluation.
* Health recommendations based on reported symptoms.

## 🎮 Brain Games

* Interactive games designed to improve:

  * Memory
  * Focus
  * Cognitive performance

## 💡 Health Facts

* Educational health facts and medical trivia.
* Daily learning opportunities.
* "Did You Know?" pop-ups with fascinating human body facts and medical trivia.

## 👨‍⚕️ Doctor Consultation Suggestions

* Intelligent recommendations for professional medical consultation.
* Supports early decision-making for health concerns.

## 📊 Health History & Metrics

* Store historical health records.
* Visualize health trends and patterns.

---

# ⚙️ Technology Stack

| Category        | Technologies              |
| --------------- | ------------------------- |
| Frontend        | React + Vite + TypeScript |
| Styling         | Tailwind CSS + ShadCN UI  |
| Backend         | Supabase                  |
| Authentication  | Supabase Auth             |
| Database        | PostgreSQL (Supabase)     |
| Edge Functions  | Supabase Functions        |
| Deployment      | Netlify                   |
| Version Control | Git & GitHub              |

---

# 📸 Screenshots

> Add screenshots of the following sections:

* Dashboard
* Symptom Analyzer
* Health Metrics
* Brain Games
* Settings Page
* Mobile Responsive View


Example:

```md
![Dashboard](screenshots/dashboard.png)
![Symptom Analyzer](screenshots/analyzer.png)
```

---

# 🚀 Installation & Setup

## 1. Clone Repository

```bash
git clone https://github.com/mohdmaazgani/symptom-scribe-clean.git
cd symptom-scribe-clean
```

## 2. Configure Environment Variables

Copy the example env file and add your Supabase browser credentials (Dashboard → Project Settings → API):

```bash
cp .env.example .env.local
```

Add the browser variables to `.env.local`:

- `VITE_SUPABASE_URL` — used by the frontend to build the Supabase client and function URLs.
- `VITE_SUPABASE_PUBLISHABLE_KEY` — canonical browser key for authentication and API access.

> [!NOTE]
> `VITE_SUPABASE_ANON_KEY` is accepted only as a legacy fallback when `VITE_SUPABASE_PUBLISHABLE_KEY` is missing. Prefer `VITE_SUPABASE_PUBLISHABLE_KEY` for new and updated environments.

## 3. Link Supabase & Apply Migrations

To ensure your local database contains all the necessary schemas (like `profiles`, `symptom_history`, and custom functions/triggers) so that data can save correctly, link your project and push migrations:

```bash
# Log in to Supabase CLI
npx supabase login

# Link your local repo to your remote project
npx supabase link --project-ref <your-project-ref>

# Push the schema, triggers, and functions to the linked project
npx supabase db push
```

## 4. Install Dependencies

```bash
npm install
```

## 5. Start Development Server

```bash
npm run dev
```

Open in your browser → [http://localhost:8080](http://localhost:8080)


### Supabase Edge Function Setup

The browser app and Supabase edge functions use different environment surfaces. Browser variables are loaded into Vite at build time and live in `.env.local`. Edge-function runtime secrets are read by deployed functions or by the Supabase CLI when you serve them locally — **never** place `SUPABASE_SERVICE_ROLE_KEY` or other edge secrets in `.env.local`.

**Edge function secrets** (configure via Supabase Dashboard or CLI, not in `.env.local`):

- `GEMINI_API_KEY` — recommended (free); used by `supabase/functions/symptom-analyzer` to call the Gemini API.
- `OPENAI_API_KEY` — optional; used as an alternative key for OpenAI integration.
- `LOVABLE_API_KEY` — optional; used as an alternative key for Lovable's AI gateway.
- `UPSTASH_REDIS_REST_URL` — optional; enables distributed rate limiting when present.
- `UPSTASH_REDIS_REST_TOKEN` — optional; used with `UPSTASH_REDIS_REST_URL` for Upstash-backed rate limiting.
- `TWILIO_ACCOUNT_SID` — required by `broadcast-emergency` when SMS alerts are used.
- `TWILIO_AUTH_TOKEN` — required by `broadcast-emergency` when SMS alerts are used.
- `TWILIO_PHONE_NUMBER` — required by `broadcast-emergency` as the sender phone number.
- `WEBHOOK_SECRET` — optional; allows webhook-authenticated cache invalidation.

**Configure your Supabase project & schema:**

```bash
# Log in to your Supabase account
supabase login

# Link your local repo to your remote project
supabase link --project-ref <your-project-ref>

# Push the database migrations to build tables, triggers, and functions
supabase db push

# Set your AI API key (obtain a free Gemini key from Google AI Studio)
supabase secrets set GEMINI_API_KEY=<your-gemini-key>

# Set emergency contact integration keys (optional)
supabase secrets set TWILIO_ACCOUNT_SID=<sid> TWILIO_AUTH_TOKEN=<token> TWILIO_PHONE_NUMBER=<phone>

# Deploy the Edge Functions
supabase functions deploy symptom-analyzer
supabase functions deploy broadcast-emergency
supabase functions deploy delete-user-account
supabase functions deploy invalidate-cache
```

**Serve edge functions locally (optional):**

```bash
# Add secrets to supabase/.env.local first, then serve
supabase functions serve --env-file supabase/.env.local
```

Keep the service role key out of browser-loaded files and client-side code.


## 📂 Project Structure

```text
symptom-scribe-clean/
├── docs/                                             # Project documentation
│   ├── guides/                                       # User & contributor guides
│   │   ├── CONTRIBUTING.md
│   │   ├── TROUBLESHOOT.md
│   │   └── PASSWORD_STRENGTH_FEATURE.md
│   └── reference/                                    # Reference documentation
│       ├── CHANGELOG.md
│       ├── FAQ.md
│       └── SECURITY.md 
├── public/                                           # Static assets
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx                    # Route protection
│   │   ├── chat/
│   │   │   ├── ChatInterface.tsx                     # Main chat interface
│   │   │   ├── ChatLoading.tsx                       # Loading state
│   │   │   └── ChatMessage.tsx                       # Individual message
│   │   ├── common/
│   │   │   └── ErrorBoundary.tsx                     # Error handling
│   │   ├── diagnostics/
│   │   │   └── StartupDiagnostics.tsx                # Startup checks
│   │   ├── hero/
│   │   │   └── Hero.tsx                              # Landing page hero
│   │   ├── layout/
│   │   │   ├── AppSidebar.tsx                        # Sidebar navigation
│   │   │   └── Layout.tsx                            # Shared layout
│   │   ├── legal/
│   │   │   ├── LegalPageLayout.tsx                   # Legal page wrapper
│   │   │   ├── PageFooter.tsx                        # Footer component
│   │   │   └── Section.tsx                           # Legal sections
│   │   ├── navigation/
│   │   │   ├── BackToTop.tsx                         # Back to top button
│   │   │   └── ScrollToTop.tsx                       # Scroll manager
│   │   ├── registration/
│   │   │   ├── forms/
│   │   │   │   └── MultiStepSignUp.tsx               # Registration form
│   │   │   ├── shared/
│   │   │   │   └── PasswordStrengthMeter.tsx         # Password strength indicator
│   │   │   └── tests/
│   │   │       └── PasswordStrengthMeter.test.tsx    # Registration tests
│   │   ├── theme/
│   │   │   ├── components/
│   │   │   │   └── AnimatedThemeToggler.tsx          # Theme switcher
│   │   │   ├── providers/
│   │   │   │   └── theme-provider.tsx                # Theme provider
│   │   │   └── styles/
│   │   │       └── animated-theme-toggler.css        # Theme styles
│   │   └── ui/                                       # Shared UI components
│   ├── data/                                         # Static datasets
│   ├── hooks/                                        # Custom React hooks
│   ├── integrations/                                 # External integrations
│   ├── lib/                                          # Utility functions
│   ├── pages/
│   │   ├── Auth/
│   │   │   └── Index.tsx                             # Authentication page
│   │   ├── Blog/
│   │   │   ├── BlogPostPage.tsx                      # Blog details
│   │   │   └── Index.tsx                             # Blog listin
│   │   ├── Chat/
│   │   │   └── Index.tsx                             # Chat page
│   │   ├── Contact/
│   │   │   └── Index.tsx                             # Contact page
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.test.tsx                    # Dashboard tests
│   │   │   └── Index.tsx                             # Dashboard page
│   │   ├── Games/
│   │   │   └── BrainGames.tsx                        # Brain games
│   │   ├── Health/
│   │   │   ├── AIHealthAssistant.tsx                 # AI assistant
│   │   │   ├── Emergency.tsx                         # Emergency guide
│   │   │   ├── HealthFacts.tsx                       # Health facts
│   │   │   └── HealthLibrary.tsx                     # Health library
│   │   ├── History/
│   │   │   └── Index.tsx                             # User history
│   │   ├── Home/
│   │   │   └── Index.tsx                             # Home page
│   │   ├── Legal/
│   │   │   ├── Accessibility.tsx
│   │   │   ├── Disclaimer.tsx
│   │   │   ├── Privacy.tsx
│   │   │   └── Terms.tsx
│   │   ├── Metrics/
│   │   │   └── Index.tsx                            # Metrics dashboard
│   │   ├── NotFound/
│   │   │   └── Index.tsx                            # 404 page
│   │   ├── Profile/
│   │   │   └── Index.tsx                            # Profile page
│   │   └── User/
│   │       ├── ResetPassword.tsx                    # Password reset
│   │       └── Settings.tsx                         # User settings
│   ├── test/
│   │   ├── AllProviders.tsx                         # Test providers
│   │   ├── setup.ts                                 # Test setup
│   │   └── utils.tsx                                # Test utilities
│   │
│   ├── App.css                                      # Global styles
│   ├── App.tsx                                      # Root component
│   ├── index.css                                    # Base styles
│   ├── main.tsx                                     # Entry point
│   └── vite-env.d.ts                                # Vite typings
│
├── supabase/
│   ├── .branches/                                   # Branch metadata
│   ├── .temp/                                       # Temporary files
│   ├── functions/                                   # Edge functions
│   ├── migrations/                                  # Database migrations
│   └── config.toml                                  # Supabase configuration
│
├── CODE_OF_CONDUCT.md                               # Community guidelines
├── README.md                                        # Project documentation
├── components.json                                  # UI component configuration
├── Dockerfile                                       # Docker container setup
├── eslint.config.js                                 # ESLint configuration
├── index.html                                       # Main HTML entry file
├── nginx.conf                                       # Nginx server configuration
├── package.json                                     # Project dependencies and scripts
├── package-lock.json                                # Locked dependency versions
├── postcss.config.js                                # PostCSS configuration
├── tailwind.config.ts                               # Tailwind CSS configuration
├── tsconfig.json                                    # TypeScript configuration
├── tsconfig.app.json                                # App TypeScript settings
├── tsconfig.node.json                               # Node TypeScript settings
├── vite.config.ts                                   # Vite configuration
├── .env.example                                     # Example environment variables
├── .env.local                                       # Local environment variables
├── .gitignore                                       # Git ignored files
├── .dockerignore                                    # Docker ignored files
├── .editorconfig                                    # Editor formatting rules
├── .nvmrc                                           # Node.js version
├── .prettierignore                                  # Prettier ignored files
├── .prettierrc                                      # Prettier configuration
└── bun.lockb                                        # Bun lock file
```

---

# 🔐 Environment Variables

## Frontend Variables

| Variable                      | Description                |
| ----------------------------- | -------------------------- |
| VITE_SUPABASE_URL             | Supabase Project URL       |
| VITE_SUPABASE_PUBLISHABLE_KEY | Browser authentication key |
| VITE_SUPABASE_ANON_KEY        | Legacy fallback if the publishable key is missing |

### Important

Only variables prefixed with `VITE_` are exposed to the frontend. The app reads `VITE_SUPABASE_PUBLISHABLE_KEY` first and falls back to `VITE_SUPABASE_ANON_KEY` only for older local setups.

---

# ☁️ Supabase Edge Function Setup

## Required Secrets

| Secret                    | Purpose                          |
| ------------------------- | -------------------------------- |
| LOVABLE_API_KEY           | AI gateway access                |
| SUPABASE_URL              | Supabase project URL (System Injected) |
| SUPABASE_ANON_KEY         | Caller validation (System Injected)    |
| SUPABASE_SERVICE_ROLE_KEY | Admin account-deletion flows (System Injected) |
| TWILIO_ACCOUNT_SID        | Emergency SMS alerts             |
| TWILIO_AUTH_TOKEN         | Emergency SMS alerts             |
| TWILIO_PHONE_NUMBER       | Emergency SMS sender number      |
| UPSTASH_REDIS_REST_URL    | Optional rate limiting/cache     |
| UPSTASH_REDIS_REST_TOKEN  | Optional rate limiting/cache     |
| WEBHOOK_SECRET            | Optional cache webhook auth      |

## Configure Secrets

```bash
supabase login

supabase link --project-ref <project-ref>

supabase secrets set LOVABLE_API_KEY=<key>

supabase secrets set TWILIO_ACCOUNT_SID=<sid>

supabase secrets set TWILIO_AUTH_TOKEN=<token>

supabase secrets set TWILIO_PHONE_NUMBER=<phone>
```

Optional:

```bash
supabase secrets set UPSTASH_REDIS_REST_URL=<url>

supabase secrets set UPSTASH_REDIS_REST_TOKEN=<token>

supabase secrets set WEBHOOK_SECRET=<secret>
```

## Local Edge Functions

```bash
supabase functions serve --env-file supabase/.env.local
```

---

# 🔌 API & Backend Services

## Authentication

Handled through:

* Supabase Auth
* JWT Session Management

## Database

Managed via:

* PostgreSQL
* Supabase Migrations

## Edge Functions

Current Functions:

* `symptom-analyzer`
* `broadcast-emergency`
* `get-cached-data`
* `invalidate-cache`
* `delete-user-account`

---

# 🧩 Project Structure

```text
symptom-scribe-clean/
├── public/                                           # Static assets
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx                    # Route protection
│   │   ├── chat/
│   │   │   ├── ChatInterface.tsx                     # Main chat interface
│   │   │   ├── ChatLoading.tsx                       # Loading state
│   │   │   └── ChatMessage.tsx                       # Individual message
│   │   ├── common/
│   │   │   └── ErrorBoundary.tsx                     # Error handling
│   │   ├── diagnostics/
│   │   │   └── StartupDiagnostics.tsx                # Startup checks
│   │   ├── hero/
│   │   │   └── Hero.tsx                              # Landing page hero
│   │   ├── layout/
│   │   │   ├── AppSidebar.tsx                        # Sidebar navigation
│   │   │   └── Layout.tsx                            # Shared layout
│   │   ├── legal/
│   │   │   ├── LegalPageLayout.tsx                   # Legal page wrapper
│   │   │   ├── PageFooter.tsx                        # Footer component
│   │   │   └── Section.tsx                           # Legal sections
│   │   ├── navigation/
│   │   │   ├── BackToTop.tsx                         # Back to top button
│   │   │   └── ScrollToTop.tsx                       # Scroll manager
│   │   ├── registration/
│   │   │   ├── forms/
│   │   │   │   └── MultiStepSignUp.tsx               # Registration form
│   │   │   ├── shared/
│   │   │   │   └── PasswordStrengthMeter.tsx         # Password strength indicator
│   │   │   └── tests/
│   │   │       └── PasswordStrengthMeter.test.tsx    # Registration tests
│   │   ├── theme/
│   │   │   ├── components/
│   │   │   │   └── AnimatedThemeToggler.tsx          # Theme switcher
│   │   │   ├── providers/
│   │   │   │   └── theme-provider.tsx                # Theme provider
│   │   │   └── styles/
│   │   │       └── animated-theme-toggler.css        # Theme styles
│   │   └── ui/                                       # Shared UI components
│   ├── data/                                         # Static datasets
│   ├── hooks/                                        # Custom React hooks
│   ├── integrations/                                 # External integrations
│   ├── lib/                                          # Utility functions
│   ├── pages/
│   │   ├── Auth/
│   │   │   └── Index.tsx                             # Authentication page
│   │   ├── Blog/
│   │   │   ├── BlogPostPage.tsx                      # Blog details
│   │   │   └── Index.tsx                             # Blog listin
│   │   ├── Chat/
│   │   │   └── Index.tsx                             # Chat page
│   │   ├── Contact/
│   │   │   └── Index.tsx                             # Contact page
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.test.tsx                    # Dashboard tests
│   │   │   └── Index.tsx                             # Dashboard page
│   │   ├── Games/
│   │   │   └── BrainGames.tsx                        # Brain games
│   │   ├── Health/
│   │   │   ├── AIHealthAssistant.tsx                 # AI assistant
│   │   │   ├── Emergency.tsx                         # Emergency guide
│   │   │   ├── HealthFacts.tsx                       # Health facts
│   │   │   └── HealthLibrary.tsx                     # Health library
│   │   ├── History/
│   │   │   └── Index.tsx                             # User history
│   │   ├── Home/
│   │   │   └── Index.tsx                             # Home page
│   │   ├── Legal/
│   │   │   ├── Accessibility.tsx
│   │   │   ├── Disclaimer.tsx
│   │   │   ├── Privacy.tsx
│   │   │   └── Terms.tsx
│   │   ├── Metrics/
│   │   │   └── Index.tsx                            # Metrics dashboard
│   │   ├── NotFound/
│   │   │   └── Index.tsx                            # 404 page
│   │   ├── Profile/
│   │   │   └── Index.tsx                            # Profile page
│   │   └── User/
│   │       ├── ResetPassword.tsx                    # Password reset
│   │       └── Settings.tsx                         # User settings
│   ├── test/
│   │   ├── AllProviders.tsx                         # Test providers
│   │   ├── setup.ts                                 # Test setup
│   │   └── utils.tsx                                # Test utilities
│   │
│   ├── App.css                                      # Global styles
│   ├── App.tsx                                      # Root component
│   ├── index.css                                    # Base styles
│   ├── main.tsx                                     # Entry point
│   └── vite-env.d.ts                                # Vite typings
│
├── supabase/
│   ├── .branches/                                   # Branch metadata
│   ├── .temp/                                       # Temporary files
│   ├── functions/                                   # Edge functions
│   ├── migrations/                                  # Database migrations
│   └── config.toml                                  # Supabase configuration
│
├── CHANGELOG.md                                     # Release history and updates
├── CODE_OF_CONDUCT.md                               # Community guidelines
├── CONTRIBUTING.md                                  # Contribution guide
├── FAQ.md                                           # Frequently asked questions
├── README.md                                        # Project documentation
├── SECURITY.md                                      # Security policy
├── TROUBLESHOOT.md                                  # Common issue resolutions
├── components.json                                  # UI component configuration
├── Dockerfile                                       # Docker container setup
├── eslint.config.js                                 # ESLint configuration
├── index.html                                       # Main HTML entry file
├── nginx.conf                                       # Nginx server configuration
├── package.json                                     # Project dependencies and scripts
├── package-lock.json                                # Locked dependency versions
├── postcss.config.js                                # PostCSS configuration
├── tailwind.config.ts                               # Tailwind CSS configuration
├── tsconfig.json                                    # TypeScript configuration
├── tsconfig.app.json                                # App TypeScript settings
├── tsconfig.node.json                               # Node TypeScript settings
├── vite.config.ts                                   # Vite configuration
├── .env.example                                     # Example environment variables
├── .env.local                                       # Local environment variables
├── .gitignore                                       # Git ignored files
├── .dockerignore                                    # Docker ignored files
├── .editorconfig                                    # Editor formatting rules
├── .nvmrc                                           # Node.js version
├── .prettierignore                                  # Prettier ignored files
├── .prettierrc                                      # Prettier configuration
└── bun.lockb                                        # Bun lock file
```

---

# 📘 Usage Guide

### 1. Create Account

Register using email authentication.

### 2. Track Metrics

Add health records and wellness metrics.

### 3. Analyze Symptoms

Use AI-assisted symptom analysis.

### 4. Explore Health Facts

Learn through interactive educational content.

### 5. Improve Cognitive Skills

Play brain-training games.

---

# 🛠️ Troubleshooting

For detailed troubleshooting instructions, see:

```text
TROUBLESHOOTING.md
```

Common issues include:

* Missing environment variables
* Supabase authentication failures
* Dependency installation errors
* Port conflicts
* Build failures

---

# ❓ FAQ

### Why are my environment variables undefined?

Ensure all client-side variables begin with:

```env
VITE_
```

### Why can't I log in?

Verify:

* Supabase credentials
* User account status
* Environment variables

### Why does the app fail to build?

Check:

* Dependency installation
* TypeScript errors
* Environment configuration

---

# 🤝 Contributing

Contributions are welcome!

## Contribution Steps

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push your branch.
5. Open a Pull Request.

###  Contributors

Thanks to all contributors ❤️

[![Contributors](https://contrib.rocks/image?repo=mohdmaazgani/symptom-scribe-clean)](https://github.com/mohdmaazgani/symptom-scribe-clean/graphs/contributors)


## Pull Request Requirements

### Related Issue

```text
Closes #<issue-number>
```

### Checklist

* [ ] Tested locally
* [ ] No unrelated files changed
* [ ] Code style followed
* [ ] Issue linked
* [ ] No console errors
* [ ] Issue assigned before work began

---

# 🚀 Future Enhancements

* Wearable device integration
* AI-powered conversational diagnosis
* Medication reminders
* Advanced analytics dashboards
* Doctor-patient collaboration portal
* Personalized health forecasting

---

# 📄 License

This project is licensed under the MIT License.

You are free to:

* Use
* Modify
* Distribute

the software under the terms of the MIT License.

---

# 👨‍💻 Author

Developed by **@mohdmaazgani**

✨ Passionate about building intelligent, user-centric healthcare solutions.
