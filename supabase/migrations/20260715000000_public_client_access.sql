-- Public client access mirror for the Minecraft mod
-- Purpose: let the mod read the verified profile/HWID/subscription state without needing a login flow inside Minecraft.

CREATE TABLE IF NOT EXISTS client_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text,
  username text,
  hwid text,
  role text DEFAULT 'User',
  subscription_active boolean DEFAULT false,
  subscription_end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE client_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_client_access" ON client_access;
CREATE POLICY "public_select_client_access" ON client_access
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "authenticated_upsert_own_client_access" ON client_access;
CREATE POLICY "authenticated_upsert_own_client_access" ON client_access
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "authenticated_update_own_client_access" ON client_access;
CREATE POLICY "authenticated_update_own_client_access" ON client_access
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_client_access_username ON client_access(username);
CREATE INDEX IF NOT EXISTS idx_client_access_hwid ON client_access(hwid);
