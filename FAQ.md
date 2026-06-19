# ❓ Frequently Asked Questions (FAQ)

> A quick reference for users and contributors of **Symptom Scribe** — the smart health tracking and wellness platform.

---

## 📌 Table of Contents

- [General Questions](#-general-questions)
- [Setup & Installation](#-setup--installation)
- [Using the Platform](#-using-the-platform)
- [Contributing & GSSoC](#-contributing--gssoc)
- [Common Errors & Fixes](#-common-errors--fixes)

---

## 🧩 General Questions

### What is Symptom Scribe?

**Symptom Scribe** is a one-stop health tracking and wellness platform that helps users monitor their health goals, analyze symptoms, and receive intelligent insights — all in one place. It also includes brain-enhancing games, doctor consultation suggestions, and AI-driven health recommendations.

### Is Symptom Scribe free to use?

Yes! Symptom Scribe is completely open-source and free to use. It is licensed under the **MIT License**.

### Where is the live website?

You can access the live platform here: [https://symptom-scribe-clean.netlify.app/](https://symptom-scribe-clean.netlify.app/)

### What tech stack does this project use?

| Category            | Technologies              |
| ------------------- | ------------------------- |
| **Frontend**        | React + Vite + TypeScript |
| **Styling**         | Tailwind CSS + ShadCN UI  |
| **Backend / Auth**  | Supabase                  |
| **Deployment**      | Netlify                   |
| **Version Control** | GitHub                    |

### Who built this project?

Symptom Scribe was developed by [@mohdmaazgani](https://github.com/mohdmaazgani).

---

## ⚙️ Setup & Installation

### How do I run this project locally?

Follow these steps:

**1. Clone the repository**

```bash
git clone https://github.com/mohdmaazgani/symptom-scribe-clean.git
cd symptom-scribe-clean
```

**2. Set up environment variables**

Copy the example env file and fill in your Supabase credentials (Dashboard → Project Settings → API):

```bash
cp .env.example .env.local
```

Add only the following **browser** variables to `.env.local`:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

If you are still migrating older local setups, `VITE_SUPABASE_ANON_KEY` is accepted as a fallback, but it should be replaced with the publishable key.

**3. Install dependencies**

```bash
npm install
```

**4. Start the development server**

```bash
npm run dev
```

**5. Open in your browser**

```
http://localhost:8080
```

### What environment variables do the Supabase edge functions need?

The browser app only needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, with `VITE_SUPABASE_ANON_KEY` kept as a legacy fallback. The edge functions use a separate runtime secret set: `LOVABLE_API_KEY` is required for the symptom-analyzer function; `SUPABASE_URL` and `SUPABASE_ANON_KEY` are used by auth-validating functions; `SUPABASE_SERVICE_ROLE_KEY` is used by account-deletion functions; `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` are required for emergency SMS alerts; `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and `WEBHOOK_SECRET` are optional for rate limiting, cache, and webhook flows.

Browser-loaded variables belong in `.env.local`, while Supabase runtime secrets should be configured in the Supabase dashboard or with the Supabase CLI — **never** place `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

**Configure edge function secrets with the Supabase CLI:**

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase secrets set LOVABLE_API_KEY=<your-key>
supabase secrets set SUPABASE_URL=<your-url> SUPABASE_ANON_KEY=<your-anon-key> SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
supabase secrets set TWILIO_ACCOUNT_SID=<sid> TWILIO_AUTH_TOKEN=<token> TWILIO_PHONE_NUMBER=<phone>
# Optional rate limiting:
supabase secrets set UPSTASH_REDIS_REST_URL=<url> UPSTASH_REDIS_REST_TOKEN=<token>
# Optional webhook cache invalidation:
supabase secrets set WEBHOOK_SECRET=<secret>
```

**Serve edge functions locally (optional):**

```bash
supabase functions serve --env-file supabase/.env.local
```

### What Node.js version is recommended?

Use **Node.js 20** (see `.nvmrc`). Node 18+ is supported in CI; Node 20 is recommended for local development.

### Can I use `bun` instead of `npm`?

The repo includes a `bun.lockb`, but **npm is the canonical package manager** (used in CI and contribution docs). For the most reliable setup, use:

```bash
npm install
npm run dev
```

Bun may work for local development (`bun install` / `bun dev`), but PR validation runs with `npm ci`.

---

## 🩺 Using the Platform

### What features does Symptom Scribe offer?

- **Health & Wellness Tracking** — Track steps, hydration, and nutrition with personalized tips
- **Symptom Analysis** — Log symptoms and get AI-assisted health insights
- **Brain Games** — Scientifically designed games to improve focus and memory
- **Health Facts** — "Did You Know?" pop-ups with interesting medical trivia
- **Doctor Consultation** — Smart suggestions for professional consultations based on your symptom patterns

### Do I need to create an account to use the platform?

Yes, authentication is handled via **Supabase**. You need to sign up to access personalized features like symptom tracking and health dashboards.

### Is my health data safe?

The platform uses **Supabase** for secure backend and authentication. However, this is an open-source project, so always be mindful of what personal data you enter in any web application.

### What are the future features planned?

- Integration with wearable devices (Fitbit, Apple Watch)
- AI-powered chat diagnosis
- Prescription reminders and progress dashboards
- Multi-user (doctor-patient) collaboration system

---

## 🤝 Contributing & GSSoC

### How do I contribute to this project?

1. Check the [CONTRIBUTING.md](./CONTRIBUTING.md) file for detailed guidelines
2. Look for open issues in the [Issues tab](https://github.com/mohdmaazgani/symptom-scribe-clean/issues)
3. Comment on an issue asking to be assigned before you start working
4. Fork the repo, make your changes, and open a Pull Request

### What is GSSoC?

**GirlScript Summer of Code (GSSoC)** is an open-source program where contributors work on real-world projects under mentor guidance. Symptom Scribe is a participating project in **GSSoC 2026**.

### How do I participate in GSSoC through this project?

1. Visit the [GSSoC official website](https://gssoc.girlscript.tech/) and register as a contributor
2. Browse open issues labeled with GSSoC tags in this repository
3. Comment on an issue requesting assignment
4. Wait for the maintainer to assign the issue to you before starting work
5. Submit your PR once the work is done

### Can I work on an issue without being assigned?

**No.** Please wait to be officially assigned to an issue before submitting a PR. PRs without a linked and assigned issue will not be reviewed.

### How do I report a bug?

Open a new issue in the [Issues tab](https://github.com/mohdmaazgani/symptom-scribe-clean/issues) and follow the bug report template. Include steps to reproduce, expected behavior, and screenshots if applicable.

### How do I request a new feature?

Open a new issue and use the feature request template. Clearly describe the problem it solves and the proposed solution.

### What should my PR include?

- A linked issue number (`Closes #issue-number`)
- A clear description of the changes
- Screenshots for any UI changes
- A filled-out checklist confirming you tested locally

Refer to the PR template in [CONTRIBUTING.md](./CONTRIBUTING.md) for full details.

### Should I follow any code style?

Yes. The project uses **TypeScript + Tailwind CSS**. Make sure your code:

- Has no TypeScript errors
- Follows existing component patterns
- Has no unused imports or console logs

---

## 🐛 Common Errors & Fixes

### `npm install` fails with dependency errors

Try clearing the cache and reinstalling:

```bash
npm cache clean --force
rm -rf node_modules
npm install
```

### The dev server doesn't start or shows a blank page

- Make sure you've set up `.env.local` with valid Supabase credentials
- Check the startup diagnostics screen for any missing required variables
- Check that you're running on the correct port: `http://localhost:8080`
- Try stopping and restarting with `npm run dev`

### Supabase connection errors

- Double-check your `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`
- Make sure your Supabase project is active and not paused

### Edge function fails with missing secret errors

- Verify that `LOVABLE_API_KEY` is configured for the symptom-analyzer edge function
- Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` only if you want Upstash-backed distributed rate limiting or cache support; they are optional
- Confirm that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set for auth-validating functions, and `SUPABASE_SERVICE_ROLE_KEY` is set for account-deletion functions
- Confirm that `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` are set before using emergency SMS alerts
- Add `WEBHOOK_SECRET` only if you use webhook-triggered cache invalidation; it is optional
- Re-run secret setup with the Supabase CLI, then redeploy or re-serve the function:

  ```bash
  supabase secrets set LOVABLE_API_KEY=<your-key>
  supabase secrets set SUPABASE_URL=<your-url> SUPABASE_ANON_KEY=<your-anon-key> SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
  supabase secrets set TWILIO_ACCOUNT_SID=<sid> TWILIO_AUTH_TOKEN=<token> TWILIO_PHONE_NUMBER=<phone>
  supabase functions serve --env-file supabase/.env.local
  ```

### TypeScript errors after pulling latest changes

```bash
npm install
```

New dependencies may have been added. Always run `npm install` after pulling.

### Build fails on Netlify

- Ensure all environment variables are added in your Netlify dashboard under **Site Settings → Environment Variables**
- Run `npm run build` locally first to catch any build errors before pushing

---

## 📚 More Resources

- 📖 [README.md](./README.md) — Project overview and setup
- 🤝 [CONTRIBUTING.md](./CONTRIBUTING.md) — Contribution guidelines
- 📜 [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) — Community standards
- 🌐 [Live Website](https://symptom-scribe-clean.netlify.app/)
- 🐛 [Open Issues](https://github.com/mohdmaazgani/symptom-scribe-clean/issues)

---

> 💬 Still have a question? Feel free to open a [Discussion](https://github.com/mohdmaazgani/symptom-scribe-clean/discussions) or comment on a relevant issue!
