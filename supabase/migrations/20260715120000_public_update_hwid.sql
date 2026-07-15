-- Allow anonymous HWID update for the Minecraft mod
-- The mod uses anon key (not authenticated), so we need public UPDATE for hwid column

DROP POLICY IF EXISTS "public_update_hwid_client_access" ON client_access;
CREATE POLICY "public_update_hwid_client_access" ON client_access
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
