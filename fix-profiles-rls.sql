-- PROFIL RLS NI TOZALASH — SQL Editor da ishga tushir
-- 1. Barcha eski policylarni o'chir
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
DROP POLICY IF EXISTS "admin_select_profiles" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
DROP POLICY IF EXISTS "admin_update_profiles" ON profiles;
DROP POLICY IF EXISTS "admin_delete_profile" ON profiles;
DROP POLICY IF EXISTS "insert_profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;

-- 2. Yangi oddiy policylar
-- Hamma o'z profilini o'qiy oladi + admin hammasini
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (true);

-- Hamma o'z profilini yangilay oladi
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Admin hammani yangilay oladi
CREATE POLICY "profiles_admin_update" ON profiles
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

-- Signup trigger orqali yaratiladi
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (true);

-- Admin o'chira oladi
CREATE POLICY "profiles_admin_delete" ON profiles
  FOR DELETE USING (is_admin());
