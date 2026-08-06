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

## Row-Level Security (RLS) - Critical Security Boundary

**Issue #795**: The Supabase anon key is public. RLS policies are the ONLY security mechanism preventing unauthorized cross-user data access.

All user-data tables have RLS enabled with strict `auth.uid()` checks:

### Protected Tables
- **symptom_history**: Users can only access their own symptom records
- **health_metrics**: Users can only access their own health metrics
- **chat_sessions**: Users can only access their own chat sessions
- **profiles**: Public read (for peer discovery), user-restricted write

### RLS Policy Pattern
```sql
-- Example: Users can only view their own data
CREATE POLICY "users_can_only_access_own_data"
  ON symptom_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

### Verification
To verify RLS is enabled on all tables:
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All user-data tables should show `rowsecurity = true`.

### Attack Scenarios Prevented
1. **Cross-user data access**: Without RLS, anon key could query all users' symptoms
2. **Data exposure**: Health metrics, chat history isolated by user_id
3. **Session hijacking**: Chat sessions strictly user-scoped

**Never disable RLS on these tables.** If you must modify RLS policies, update the migration and test thoroughly before deployment.

## Incident History

Initial commit (93fbbcf) contained exposed Supabase credentials in the .env file. These credentials have been invalidated. The .env file was removed from tracking in commit b6bfb80. Developers should be aware that cloning from commit 93fbbcf exposes the old (now invalidated) credentials from git history.

Issue #795 discovered that RLS policies were not enforced, allowing potential cross-user data access with the exposed anon key. This was fixed by enabling RLS on all user-data tables with strict `auth.uid()` policies.
