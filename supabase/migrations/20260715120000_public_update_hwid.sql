-- Allow anonymous HWID update and first-time insert for the Minecraft mod
-- The mod uses anon key (not authenticated), so we need public access for hwid

DROP POLICY IF EXISTS "public_update_hwid_client_access" ON client_access;
CREATE POLICY "public_update_hwid_client_access" ON client_access
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "public_insert_client_access" ON client_access;
CREATE POLICY "public_insert_client_access" ON client_access
  FOR INSERT
  WITH CHECK (true);
