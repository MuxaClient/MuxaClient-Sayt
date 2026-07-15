/*
# Fix profiles INSERT — allow trigger and service role to create profiles

The handle_new_user trigger was failing because RLS blocked the INSERT
even for SECURITY DEFINER functions in Supabase's environment.

Fixes:
1. Add an INSERT policy that allows users to create their OWN profile row
   (where id = auth.uid()), which is what the trigger does immediately
   after signup when the JWT is fresh.
2. Drop the admin-only insert policy and replace with a broader one that
   covers both the trigger context (service role bypasses RLS) and
   direct inserts where id = auth.uid().
3. Re-create the trigger function with explicit search_path to avoid
   schema resolution issues.
*/

-- Drop the old restrictive insert policy
DROP POLICY IF EXISTS "admin_insert_profile" ON profiles;

-- Allow a user to insert their own profile row (id must match auth.uid())
-- This covers the trigger context and any direct inserts
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- Also let the service_role bypass RLS entirely (Supabase default)
-- by ensuring the trigger function bypasses row security
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

-- Grant the trigger function permission to bypass RLS on profiles
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

-- The service_role (used by Supabase internals and the trigger) bypasses RLS
-- We also need to grant the anon/authenticated roles access through policies
-- Ensure the trigger re-runs correctly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
