-- Enable Row Level Security (RLS) policies on all user data tables
-- Issue: https://github.com/mohdmaazgani/symptom-scribe-clean/issues/795
--
-- Fixes critical vulnerability where exposed anon key could access all users' data
-- when RLS policies were not enforced. Each table now has policies restricting
-- access to the authenticated user's own data.

-- ===========================
-- symptom_history Table
-- ===========================

-- Enable RLS on symptom_history
ALTER TABLE symptom_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own symptom history
CREATE POLICY "Users can only access their own symptom history"
  ON symptom_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own symptom records
CREATE POLICY "Users can only insert their own symptom history"
  ON symptom_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own symptom records
CREATE POLICY "Users can only update their own symptom history"
  ON symptom_history
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own symptom records
CREATE POLICY "Users can only delete their own symptom history"
  ON symptom_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ===========================
-- health_metrics Table
-- ===========================

-- Enable RLS on health_metrics
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own health metrics
CREATE POLICY "Users can only access their own health metrics"
  ON health_metrics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own health metrics
CREATE POLICY "Users can only insert their own health metrics"
  ON health_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own health metrics
CREATE POLICY "Users can only update their own health metrics"
  ON health_metrics
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own health metrics
CREATE POLICY "Users can only delete their own health metrics"
  ON health_metrics
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ===========================
-- profiles Table
-- ===========================

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all profiles (for peer discovery)
CREATE POLICY "Everyone can view profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can only update their own profile
CREATE POLICY "Users can only update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===========================
-- chat_sessions Table
-- ===========================

-- Enable RLS on chat_sessions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own chat sessions
CREATE POLICY "Users can only access their own chat sessions"
  ON chat_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own chat sessions
CREATE POLICY "Users can only create their own chat sessions"
  ON chat_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own chat sessions
CREATE POLICY "Users can only update their own chat sessions"
  ON chat_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own chat sessions
CREATE POLICY "Users can only delete their own chat sessions"
  ON chat_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ===========================
-- Documentation
-- ===========================

COMMENT ON TABLE symptom_history IS
'Symptom history table with RLS enabled.

Row Level Security Policies:
- SELECT: Users can only view records where auth.uid() = user_id
- INSERT: Users can only insert records with their own user_id
- UPDATE: Users can only update their own records
- DELETE: Users can only delete their own records

With the anon key exposed in .env, RLS is the critical security boundary.
All authenticated users must verify they own a record before accessing it.';

COMMENT ON TABLE health_metrics IS
'Health metrics table with RLS enabled.

Row Level Security Policies:
- SELECT: Users can only view records where auth.uid() = user_id
- INSERT: Users can only insert records with their own user_id
- UPDATE: Users can only update their own records
- DELETE: Users can only delete their own records

Prevents cross-user health data leakage even with exposed anon key.';

COMMENT ON TABLE profiles IS
'Profiles table with RLS enabled.

Row Level Security Policies:
- SELECT: All authenticated users can view all profiles (public directory)
- UPDATE: Users can only update their own profile

Allows peer discovery while protecting profile updates.';

COMMENT ON TABLE chat_sessions IS
'Chat sessions table with RLS enabled.

Row Level Security Policies:
- SELECT: Users can only view their own sessions
- INSERT: Users can only create sessions for themselves
- UPDATE: Users can only update their own sessions
- DELETE: Users can only delete their own sessions

Prevents users from accessing or manipulating other users'' chat history.';
