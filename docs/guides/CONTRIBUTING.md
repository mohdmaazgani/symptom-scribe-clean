# Contributing to Symptom Scribe 🚀

Thank you for your interest in contributing to **Symptom Scribe**! We welcome all kinds of contributions, including bug fixes, new features, documentation improvements, design enhancements, and bug reports.

By participating in this project, you agree to abide by our code of conduct, maintaining a professional, respectful, and supportive environment for all contributors.

---

## 📌 Code of Conduct & Expected Practices

To ensure a welcoming, inclusive, and professional community:
* **Be Respectful:** Treat all fellow contributors, maintainers, and users with kindness, empathy, and respect.
* **Maintain Professionalism:** Focus on constructive feedback and positive collaboration. Refrain from demeaning, exclusionary, or harassing language.
* **Support Newcomers:** Help new contributors onboard, answer questions patiently, and foster a collaborative environment.
* **Respect Ownership:** Do not copy code from uncredited sources, and respect licensing agreements.

---

## 🛠️ Getting Started

Follow these steps to set up the project locally on your system:

### Prerequisites
Make sure you have the following installed:
* [Node.js](https://nodejs.org/) (v20 recommended — see `.nvmrc`; v18+ is supported in CI)
* [Git](https://git-scm.com/)
* A [Supabase](https://supabase.com/) project with credentials for local development
* (Optional) [Supabase CLI](https://supabase.com/docs/guides/cli) — required only if you are developing or testing edge functions locally

### Step 1: Fork and Clone the Repository
1. Click the **Fork** button at the top right of the [Symptom Scribe Repository](https://github.com/mohdmaazgani/symptom-scribe-clean) to create a copy of the repository under your GitHub account.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/symptom-scribe-clean.git
   ```
3. Navigate to the project directory:
   ```bash
   cd symptom-scribe-clean
   ```

### Step 2: Set Up Remotes
To keep your local repository in sync with the upstream repository, add a remote pointing to the main project:
```bash
git remote add upstream https://github.com/mohdmaazgani/symptom-scribe-clean.git
```

### Step 3: Configure Environment Variables
Copy the example env file and add your Supabase browser credentials (Dashboard → Project Settings → API):

```bash
cp .env.example .env.local
```

Edit `.env.local` and set these **browser-only** variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Do **not** add `SUPABASE_SERVICE_ROLE_KEY` or other edge-function secrets to `.env.local`. Configure those via the Supabase dashboard or CLI (see [README.md](./README.md) or [FAQ.md](./FAQ.md)).

### Step 4: Install Dependencies
Install all the required npm packages:
```bash
npm install
```

### Step 5: Run the Development Server
Start the local server to test the app in your browser:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:8080` (configured in `vite.config.ts`; use the port shown in your terminal if it differs).

---

## 🔄 Contribution Workflow

Please follow this workflow to submit your contributions:

1. **Find or Open an Issue:** Check the [Issues section](https://github.com/mohdmaazgani/symptom-scribe-clean/issues) before starting any work. If your proposal or bug doesn't exist, open a new issue.
2. **Request Assignment:** Leave a comment on the issue you wish to work on. Wait until a maintainer formally assigns the issue to you before writing code.
3. **Create a New Branch:** Base your branch off the latest `main` branch from upstream:
   ```bash
   git checkout main
   git pull upstream main
   git checkout -b <branch-name>
   ```
4. **Make Your Changes:** Implement your bug fix, feature, or enhancement.
5. **Test Your Changes:** Run the app locally and verify everything works correctly without warnings.
6. **Commit Your Changes:** Keep commit messages clear, concise, and structured.
7. **Submit a Pull Request:** Push your branch to your fork and create a Pull Request on GitHub.

---

## 🏷️ Branch & PR Naming Conventions

### Branch Naming
Use meaningful and descriptive names prefixed with the type of work being performed:
* `feature/add-login-page` (for new features)
* `fix/navbar-overflow` (for bug fixes)
* `docs/update-readme` (for documentation updates)
* `refactor/optimize-storage` (for code refactoring)

### Pull Request Title
Make sure your PR titles are descriptive and start with a type prefix matching standard commits:
* `feat: add responsive side navigation menu`
* `fix: correct validation checks on checkout page`
* `docs: enhance contribution guidelines`

---

## ✍️ Commit Message Guidelines

Use clear, short, and meaningful commit messages that explain **what** changed and **why**.
* **Good Commit Messages:**
  * `feat: add password strength indicators`
  * `fix: resolve crash on patient settings modal`
  * `docs: update CONTRIBUTING.md setup steps`
* **Avoid Vague Commit Messages:**
  * `update`
  * `changes`
  * `fixed stuff`

---

## 📐 Coding Standards & Style Expectations

To maintain the high quality of the Symptom Scribe codebase, all contributions should follow these standards:
* **Clean & Modular Code:** Write simple, readable, and self-documenting code. Split long components/functions into smaller, reusable helper functions/components.
* **Naming Conventions:** Use camelCase for variables/functions, PascalCase for components, and UPPER_CASE for constants.
* **TypeScript Integrity:** Avoid using `any` types; define clear interfaces and type definitions for state, props, and APIs.
* **Component Styling:** Use the project's pre-configured CSS/Tailwind utilities consistently instead of adding custom inline styles.
* **Code Formatting:** Run styling formatters if configured, and ensure there are no trailing whitespaces.

---

## 🪲 Reporting Bugs & Suggesting Features

### Reporting Bugs
If you find a bug, please open an issue and include:
1. A clear and descriptive title.
2. **Steps to Reproduce:** A step-by-step description of how to trigger the issue.
3. **Expected Behavior:** What should have happened.
4. **Actual Behavior:** What actually happened.
5. Screenshots, video recordings, or console error logs (if applicable).
6. Environment details (Browser, OS version, Node version).

### Suggesting Features
Have an idea to make Symptom Scribe better? We'd love to hear it! Open a feature request issue with:
1. A clear, high-level summary of the idea.
2. A detailed description of the proposed feature and user journey.
3. Why the feature is beneficial to the project and its users.

---

## 🆘 Need Help?

If you have questions or get stuck at any point:
* Open a new issue with the `question` label.
* Participate in GitHub discussions.
* Leave a comment on your pull request asking the maintainers for guidance.

Happy Contributing! 🎉
