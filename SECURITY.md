# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in symptom-scribe, please email security details to the project maintainers rather than using the public issue tracker. This allows us to address the vulnerability before it becomes public knowledge.

## Environment Variables and Credentials

IMPORTANT: Never commit `.env` or any files containing API keys, secrets, or credentials to version control.

How we protect secrets:
- `.env` is listed in `.gitignore` to prevent accidental commits
- `.env.example` contains placeholder values showing which variables are needed
- Developers copy `.env.example` to `.env.local` and fill in their own credentials

What to do if credentials are accidentally committed:
1. Immediately invalidate the exposed credentials (rotate keys in provider dashboard)
2. Remove the file from git tracking: `git rm --cached .env`
3. Add to `.gitignore` if not already present
4. Commit the changes: `git commit -m 'Remove accidentally committed credentials'`
5. Notify security team of the incident

For comprehensive history purging of accidentally committed secrets, see git-filter-repo documentation at https://github.com/newren/git-filter-repo

## Browser Application Security (VITE_*)

The VITE_SUPABASE_PUBLISHABLE_KEY is intentionally exposed in the browser build. This is the public anon key and is designed for browser access.

Security is enforced through:
- Supabase Row Level Security (RLS) policies
- Proper authentication and authorization checks
- Rate limiting on API endpoints
- Input validation and sanitization

## Edge Function Secrets

Never place service role keys or API tokens in `.env.local` or `.env`. These must be configured via:
- Supabase Dashboard (Project Settings > Edge Functions > Secrets)
- Command line: `supabase secrets set KEY_NAME=value`

This prevents accidental exposure in browser bundles.

## Credential Rotation

Supabase credentials should be rotated periodically:
1. Navigate to Supabase Dashboard > Project Settings > API
2. Click "Regenerate" on any key
3. Update your environment variables
4. Redeploy application

## Security Checklist for Contributors

Before committing:
- Never add `.env`, `.env.local`, or other secret files
- Always use `.env.example` as the template
- Don't hardcode API endpoints with credentials
- Use environment variables for all secrets
- Run `git status` to verify no secret files are staged

## Incident History

Initial commit (93fbbcf) contained exposed Supabase credentials in the .env file. These credentials have been invalidated. The .env file was removed from tracking in commit b6bfb80. Developers should be aware that cloning from commit 93fbbcf exposes the old (now invalidated) credentials from git history.
