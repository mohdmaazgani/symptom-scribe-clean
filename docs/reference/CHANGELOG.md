# Changelog

All notable changes to **Symptom Scribe** will be documented in this file.

This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Integration with wearable devices (Fitbit, Apple Watch)
- AI-powered chat diagnosis assistant
- Prescription reminders and progress dashboards
- Multi-user (doctor–patient) collaboration system
- `zxcvbn` entropy scoring for password strength
- Common password / dictionary word blacklist
- Password reuse prevention
- Breached password checking via Have I Been Pwned API
- Multi-language (i18n) support for error messages
- Rate limiting on the password generator endpoint

---

## [1.1.0] - 2025-05-28

### Added
- **Password Strength Meter** — real-time visual indicator with color-coded feedback
  (Very Weak → Weak → Fair → Good → Strong) using a 0–5 scoring scale.
- **Password Requirements Checklist** — interactive checklist that shows which policy
  rules are met; includes ARIA labels for full screen-reader accessibility.
- **Password Generator** — one-click secure password generation that satisfies the
  configured policy, with clipboard copy and visual copy-success feedback.
- **Password Policy Configuration** (`src/lib/password-policy-config.ts`) — centralised,
  developer-configurable rules (min length, uppercase, lowercase, digit, special char).
- **`evaluatePasswordStrength()`** utility — returns per-rule booleans, an overall
  `isStrong` flag, and a numeric `score`.
- **`generateStrongPassword()`** utility — produces a random password that meets the
  active policy.
- **`getPasswordRequirements()`** utility — returns an array of requirement objects with
  inline `test` functions, used to drive the checklist UI.
- Unit tests for all password utilities in `src/lib/password-strength.test.ts`,
  covering validation logic, strength scoring, password generation, custom policies,
  component integration, and special-character handling.
- `PASSWORD_STRENGTH_FEATURE.md` — detailed developer documentation for the feature,
  including API reference, configuration guide, accessibility notes, and migration steps.

### Security
- Enforced minimum password length of 12 characters for all new sign-ups.
- Added server-side password validation mirroring the client-side policy to prevent
  bypass via direct API calls.
- Noted that `crypto.getRandomValues()` should replace `Math.random()` in the password
  generator for production-hardened entropy.

---

## [1.0.0] - 2025-04-01

### Added
- **Health & Wellness Dashboard** — track daily vital metrics including step count,
  hydration, and nutrition goals with personalised activity tips.
- **Symptom Analysis** — log symptoms and receive AI-assisted health insights with
  doctor-recommendation suggestions based on reported patterns.
- **Brain Games** — scientifically designed mini-games to improve focus and memory.
- **Health Facts Feed** — contextual "Did You Know?" pop-ups surfacing human-body facts
  and medical trivia throughout the app.
- **Doctor Consultation System** — smart suggestion engine that recommends professional
  consultations when symptom patterns warrant escalation.
- **Authentication** — user sign-up and sign-in flows backed by Supabase Auth.
- **Supabase Integration** — full database and authentication layer via Supabase
  (`src/integrations/`).
- **Responsive UI** — built with React + Vite + TypeScript, styled with Tailwind CSS
  and ShadCN UI component library.
- **Custom React Hooks** — reusable hooks in `src/hooks/` for shared application logic.
- **Netlify Deployment** — continuous deployment pipeline targeting
  [symptom-scribe-clean.netlify.app](https://symptom-scribe-clean.netlify.app/).
- **Community files** — `README.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and
  `MIT LICENSE` added to the repository root.
- **Editor config** (`.editorconfig`) for consistent code style across contributors.

---

## Version History Summary

| Version | Date       | Highlights                                          |
|---------|------------|-----------------------------------------------------|
| 1.1.0   | 2025-05-28 | Password strength, generator, policy config, tests  |
| 1.0.0   | 2025-04-01 | Initial release — core health platform features     |

---

[Unreleased]: https://github.com/mohdmaazgani/symptom-scribe-clean/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/mohdmaazgani/symptom-scribe-clean/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/mohdmaazgani/symptom-scribe-clean/releases/tag/v1.0.0
