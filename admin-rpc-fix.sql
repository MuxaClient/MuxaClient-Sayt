-- ============================================
-- ADMIN FULL ACCESS TO client_access
-- ============================================

-- Admin can UPDATE any client_access row
DROP POLICY IF EXISTS "admin_update_client_access" ON client_access;
CREATE POLICY "admin_update_client_access" ON client_access FOR UPDATE
  USING (is_admin()) WITH CHECK (is_admin());

-- Admin can INSERT any client_access row
DROP POLICY IF EXISTS "admin_insert_client_access" ON client_access;
CREATE POLICY "admin_insert_client_access" ON client_access FOR INSERT
  WITH CHECK (is_admin());

-- Admin can DELETE any client_access row
DROP POLICY IF EXISTS "admin_delete_client_access" ON client_access;
CREATE POLICY "admin_delete_client_access" ON client_access FOR DELETE
  USING (is_admin());
