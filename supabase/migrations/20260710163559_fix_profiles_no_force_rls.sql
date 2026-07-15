/*
# Fix profiles RLS — disable FORCE RLS and use proper trigger bypass

FORCE ROW LEVEL SECURITY was incorrectly applied. In Supabase the trigger
runs as the postgres superuser (table owner) which normally bypasses RLS —
UNLESS FORCE RLS is enabled. We must remove FORCE RLS so the SECURITY DEFINER
trigger can insert without being blocked.

The insert_own_profile policy we added covers direct client inserts.
*/

-- Remove FORCE RLS so the SECURITY DEFINER trigger (runs as postgres) bypasses RLS
ALTER TABLE profiles NO FORCE ROW LEVEL SECURITY;

-- Recreate the trigger function cleanly
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
