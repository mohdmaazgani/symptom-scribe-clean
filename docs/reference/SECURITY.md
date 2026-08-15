# Security Policy

## Supported Versions

We recommend updating to the latest stable release to receive security patches.

| Version | Supported |
| ------- | --------- |
| Latest  | ✅ Yes     |
| < Latest| ❌ No      |

## Environment Variables & Public Keys

### Browser-Safe Variables

The following variables are **safe to expose in the browser bundle** and use the `VITE_` prefix:

- `VITE_SUPABASE_URL` — The Supabase project URL (public)
- `VITE_SUPABASE_PUBLISHABLE_KEY` — The Supabase public anon key (public)

These are intended for client-side authentication and are designed to be embedded in your frontend bundle. They can be viewed in DevTools and is a normal part of Supabase's security model.

### Server-Only Secrets

**Never** expose these in the browser:

- `SUPABASE_SERVICE_ROLE_KEY` — Admin token for server-side operations only
- API keys for third-party services
- Database credentials
- Encryption keys or secrets

### Environment Variable Best Practices

1. **Use `.env.example`** to document which variables exist and are needed
2. **Never commit `.env.local`** or `.env` files containing real credentials
3. **Rotate secrets regularly** if accidentally exposed
4. **Use Edge Functions** for operations requiring admin/service role access

## Secure Patterns for Sensitive Operations

### 1. Use Row-Level Security (RLS) Policies

Protect data using Supabase RLS policies instead of relying on client-side filtering:

```typescript
// src/integrations/supabase/client.ts
// Good: Use RLS policies to enforce data access
const { data } = await supabase
  .from('user_data')
  .select('*')
  // RLS policy automatically filters to current user
```

Configure RLS policies in your Supabase dashboard:
- Enable RLS on all tables containing user data
- Create policies that check `auth.uid() = user_id`
- Test policies thoroughly before deployment

### 2. Edge Functions for Admin Operations

Use Supabase Edge Functions for operations requiring admin access:

```typescript
// functions/admin-operation.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // Only called server-to-server, never from browser
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Safe to use admin key here
  const { data } = await adminClient
    .from('users')
    .delete()
    .eq('id', userId);

  return new Response(JSON.stringify(data));
});
```

### 3. Authenticate All Public Endpoints

Always verify user identity in Edge Functions:

```typescript
serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) return new Response("Unauthorized", { status: 401 });

  const { data, error } = await adminClient.auth.getUser(token);
  if (error) return new Response("Unauthorized", { status: 401 });

  // Proceed with authenticated operation
});
```

### 4. Rate Limiting & CORS

Configure proper CORS and rate limiting for sensitive endpoints:

```typescript
// functions/_cors.ts
export const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.CLIENT_URL || "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
```

## Reporting a Vulnerability

If you discover a security vulnerability within this project, please do not open a public issue. Instead, report it responsibly by contacting the maintainers directly or raising a private security advisory. We will investigate and address the issue as soon as possible.

## Security Audit Checklist

When adding new features or data handling, verify:

- [ ] **No hardcoded secrets** in code or commit history
- [ ] **RLS policies enabled** on all tables with user data
- [ ] **Admin operations use Edge Functions**, never client-side admin keys
- [ ] **Authentication verified** before processing sensitive requests
- [ ] **API rate limiting** configured on custom endpoints
- [ ] **CORS properly configured** to prevent unauthorized cross-origin access
- [ ] **Sensitive data not logged** to console or external services
- [ ] **Environment variables documented** in `.env.example`
- [ ] **Dependencies audited** with `npm audit`
- [ ] **Security headers configured** (CSP, X-Frame-Options, etc.)

## References

- [Supabase Security Guide](https://supabase.com/docs/guides/self-hosting/security/overview)
- [Row-Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Edge Functions Best Practices](https://supabase.com/docs/guides/functions)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
