-- INFINITE RECURSION TUZATISH
-- 1. Eski policylarni o'chir
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_update" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_delete" ON profiles;
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
DROP POLICY IF EXISTS "admin_select_profiles" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
DROP POLICY IF EXISTS "admin_update_profiles" ON profiles;
DROP POLICY IF EXISTS "admin_delete_profile" ON profiles;
DROP POLICY IF EXISTS "insert_profile" ON profiles;

-- 2. Yangi policylar — is_admin() ISHLATMASLIK kerak profiles da
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON profiles
  FOR DELETE USING (auth.uid() = id);
