# Row-Level Security (RLS) Policies Guide

Row-Level Security (RLS) is the primary defense mechanism in Symptom Scribe for protecting user data from unauthorized access. This guide explains how RLS policies are configured and how to properly use them.

## What is RLS?

RLS ensures that database queries automatically filter data based on the authenticated user's identity. Even if a malicious actor obtains your public Supabase credentials and writes custom SQL, RLS policies will prevent them from accessing data belonging to other users.

## Current RLS Configuration

### Tables with RLS Enabled

All tables containing user data should have RLS enabled:

1. **users** — User profile information
2. **symptoms** — Symptom records (user-specific)
3. **diagnoses** — Diagnostic histories (user-specific)
4. **session_logs** — User activity logs

### Example Policy: Users Table

```sql
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### Example Policy: Symptoms Table

```sql
-- Allow users to see only their symptoms
CREATE POLICY "Users can view own symptoms"
ON symptoms FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to create symptoms
CREATE POLICY "Users can create symptoms"
ON symptoms FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own symptoms
CREATE POLICY "Users can update own symptoms"
ON symptoms FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own symptoms
CREATE POLICY "Users can delete own symptoms"
ON symptoms FOR DELETE
USING (auth.uid() = user_id);
```

## How RLS Protects Against Public Key Exposure

Even though `VITE_SUPABASE_PUBLISHABLE_KEY` is visible in the browser:

1. **User A's browser** has access token for User A
2. **User A queries** `SELECT * FROM symptoms`
3. **RLS policy checks** if `auth.uid() = user_id`
4. **Only User A's symptoms** are returned
5. **User B's symptoms** are never sent, even if User A tries to query them directly

## Best Practices

### 1. Enable RLS on ALL Tables with User Data

```sql
-- In Supabase SQL Editor
ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;
```

### 2. Use auth.uid() in Policies

Always reference `auth.uid()` to check the authenticated user:

```sql
-- Good: Checks authenticated user
WHERE auth.uid() = user_id

-- Bad: Trusts user-submitted data
WHERE user_id = request.json->>'user_id'
```

### 3. Deny by Default

Never use permissive RLS policies. Create explicit RESTRICTIVE policies:

```sql
-- Only allow specific operations
CREATE POLICY "Restrictive" ON users FOR SELECT
USING (auth.uid() = user_id);

-- Don't create catch-all policies
CREATE POLICY "Allow all" ON users FOR SELECT
USING (true); -- NEVER DO THIS
```

### 4. Test Policies

Always test RLS policies with different user accounts:

```typescript
// Test: User A can only see their data
const { data: userAData } = await userAClient
  .from('symptoms')
  .select('*');
// userAData should only contain User A's symptoms

// Test: User A cannot access User B's data
const { data: crossUserData } = await userAClient
  .from('symptoms')
  .select('*')
  .eq('user_id', userBId);
// crossUserData should be empty (RLS blocks it)
```

### 5. Monitor RLS in Logs

Check Supabase logs for RLS violations (failed policy checks):

```
Log: "policy_violation"
Message: "SELECT violates row level security policy"
User: <user_id>
Table: <table_name>
```

## Common Mistakes to Avoid

### ❌ Don't

```typescript
// Relying on client-side filtering
const { data } = await supabase
  .from('users')
  .select('*');

// Filtering in JavaScript (RLS not applied)
const filtered = data.filter(u => u.user_id === currentUser.id);
```

### ✅ Do

```typescript
// Let RLS handle filtering
const { data } = await supabase
  .from('users')
  .select('*');
// RLS policy ensures only current user's data is returned
```

### ❌ Don't

```typescript
// Trusting user-submitted IDs
const userId = req.body.user_id;
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('user_id', userId);
```

### ✅ Do

```typescript
// Use authenticated session
const { data: { session } } = await supabase.auth.getSession();
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('user_id', session.user.id);
```

## Advanced Patterns

### Multi-Tenancy with RLS

```sql
-- Allow access to organization data
CREATE POLICY "Users can access org data"
ON org_data FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid()
  )
);
```

### Role-Based Access Control

```sql
-- Admin-only access
CREATE POLICY "Admins can view all"
ON sensitive_data FOR SELECT
USING (
  (SELECT role FROM users WHERE user_id = auth.uid()) = 'admin'
);
```

### Time-Based Policies

```sql
-- Prevent modification after deadline
CREATE POLICY "Prevent late submissions"
ON submissions FOR UPDATE
USING (
  auth.uid() = user_id
  AND created_at > NOW() - INTERVAL '24 hours'
);
```

## Troubleshooting

### "Policy violation" Errors

1. **Check if RLS is enabled**: `SELECT oid, relname FROM pg_class WHERE relname = 'your_table'`
2. **Verify user is authenticated**: Check if `auth.uid()` is returning a value
3. **Review policy logic**: Ensure the USING clause matches your use case

### Performance Issues

If RLS policies are slow:

1. Add indexes on columns used in policies: `CREATE INDEX idx_user_id ON table_name(user_id);`
2. Avoid complex subqueries in policies
3. Use Supabase's query profiler to identify bottlenecks

### Testing RLS

```bash
# Using Supabase CLI
supabase start
supabase migration up

# Test in SQL Editor with different user tokens
-- Set token for User A
-- SELECT * FROM symptoms; -- Should show only User A's data
```

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostgreSQL RLS Docs](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [RLS Best Practices](https://supabase.com/blog/rls-performance)
