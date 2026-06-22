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


## 👨‍⚕️ Doctor Consultation Suggestions

- "Did You Know?" pop-ups with fascinating human body facts and medical trivia.


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
```

## 2. Navigate to Project

```bash
cd symptom-scribe-clean
```

## 3. Install Dependencies

   ```bash
   git clone https://github.com/mohdmaazgani/symptom-scribe-clean.git
   ```

2. **Enter the project directory**

   ```bash
   cd symptom-scribe-clean
   ```

3. **Configure environment variables**

   Copy the example env file and add your Supabase browser credentials (Dashboard → Project Settings → API):

   ```bash
   cp .env.example .env.local
   ```

   Add the browser variables to `.env.local`:

   - `VITE_SUPABASE_URL` — used by the frontend to build the Supabase client and function URLs.
   - `VITE_SUPABASE_PUBLISHABLE_KEY` — canonical browser key for authentication and API access.

   `VITE_SUPABASE_ANON_KEY` is accepted only as a legacy fallback when `VITE_SUPABASE_PUBLISHABLE_KEY` is missing. Prefer `VITE_SUPABASE_PUBLISHABLE_KEY` for new and updated environments.

4. **Install dependencies**

   ```bash
   npm install
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. Open in your browser → [http://localhost:8080](http://localhost:8080)

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


```bash
npm install
```

## 4. Configure Environment Variables

```bash
cp .env.example .env.local
```


Add:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Use `.env.local` for local frontend values. Do not put Supabase edge-function secrets such as `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`; configure them in Supabase instead.

`VITE_SUPABASE_ANON_KEY` is supported only as a legacy fallback if `VITE_SUPABASE_PUBLISHABLE_KEY` is not set.

## 5. Start Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:8080

symptom-scribe-clean/
├── public/              # Static files
├── src/
│   ├── components/      # UI and reusable components
│   ├── pages/           # App pages (Dashboard, Metrics, Chat, etc.)
│   ├── integrations/    # Supabase & other service integrations
│   ├── hooks/           # Custom React hooks
│   └── main.tsx         # App entry point
├── supabase/
│   ├── functions/       # Edge functions (symptom-analyzer, delete-user-account)
│   └── migrations/      # Database migrations
├── package.json
└── vite.config.ts

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
| SUPABASE_URL              | Supabase project URL             |
| SUPABASE_ANON_KEY         | Caller validation                |
| SUPABASE_SERVICE_ROLE_KEY | Admin account-deletion flows     |
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

supabase secrets set SUPABASE_URL=<url>

supabase secrets set SUPABASE_ANON_KEY=<anon-key>

supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

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
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── integrations/
│   ├── utils/
│   └── main.tsx
├── supabase/
│   ├── functions/
│   └── migrations/
├── package.json
├── vite.config.ts
└── README.md
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
