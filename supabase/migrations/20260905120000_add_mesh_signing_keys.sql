-- Trusted registry binding an emergency-mesh P2P signing key to the account
-- that owns it, so broadcast-emergency can resolve the SMS destination from a
-- server-known record instead of trusting client-supplied contact_phone
-- (issue #1154).
--
-- contact_phone/contact_name are intentionally stored in plaintext here: the
-- corresponding profiles.emergency_contact_phone column is E2E-encrypted with
-- a key the server never sees, so it cannot be used to validate the SMS
-- destination. This table exists specifically to give the server a
-- server-readable, trusted copy for that one purpose, written only through
-- the register-emergency-contact function while the owning user is
-- authenticated and has already decrypted their own contact info client-side.
CREATE TABLE IF NOT EXISTS public.mesh_signing_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- RFC 7638 JSON Web Key thumbprint of the device's ECDSA P-256 public key.
  public_key_thumbprint TEXT NOT NULL UNIQUE,
  contact_name TEXT,
  contact_phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mesh_signing_keys_user_id_idx
  ON public.mesh_signing_keys(user_id);

ALTER TABLE public.mesh_signing_keys ENABLE ROW LEVEL SECURITY;

-- Only the owning, authenticated user can register/update/remove their own
-- device keys. broadcast-emergency reads this table with the service-role
-- key so it can resolve a relayed alert's trusted contact even when the
-- relaying device belongs to a different account (the offline mesh-relay
-- design) -- that lookup intentionally bypasses these RLS policies.
CREATE POLICY "mesh_signing_keys_select_policy" ON public.mesh_signing_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "mesh_signing_keys_insert_policy" ON public.mesh_signing_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mesh_signing_keys_update_policy" ON public.mesh_signing_keys
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mesh_signing_keys_delete_policy" ON public.mesh_signing_keys
  FOR DELETE USING (auth.uid() = user_id);
