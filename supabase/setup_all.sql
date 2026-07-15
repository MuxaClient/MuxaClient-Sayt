-- ==========================================
-- 1. PROFILES
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  hwid text,
  is_admin boolean NOT NULL DEFAULT false,
  is_blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id OR is_admin())
  WITH CHECK (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "admin_insert_profile" ON profiles;
CREATE POLICY "admin_insert_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_profile" ON profiles;
CREATE POLICY "admin_delete_profile" ON profiles FOR DELETE
  TO authenticated USING (is_admin());

-- ==========================================
-- 2. PLANS
-- ==========================================
CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  duration_days int NOT NULL,
  price bigint NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_plans" ON plans;
CREATE POLICY "read_plans" ON plans FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_all_plans" ON plans;
CREATE POLICY "admin_all_plans" ON plans FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ==========================================
-- 3. SUBSCRIPTIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending')),
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_subscription" ON subscriptions;
CREATE POLICY "select_own_subscription" ON subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "admin_all_subscriptions" ON subscriptions;
CREATE POLICY "admin_all_subscriptions" ON subscriptions FOR ALL
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ==========================================
-- 4. RECEIPTS
-- ==========================================
CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  file_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_receipt" ON receipts;
CREATE POLICY "select_own_receipt" ON receipts FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "insert_own_receipt" ON receipts;
CREATE POLICY "insert_own_receipt" ON receipts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_all_receipts" ON receipts;
CREATE POLICY "admin_all_receipts" ON receipts FOR ALL
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ==========================================
-- 5. PROMO CODES
-- ==========================================
CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  max_uses int NOT NULL DEFAULT 1,
  used_count int NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_promo_codes" ON promo_codes;
CREATE POLICY "admin_all_promo_codes" ON promo_codes FOR ALL
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "read_active_promo_codes" ON promo_codes;
CREATE POLICY "read_active_promo_codes" ON promo_codes FOR SELECT
  TO authenticated USING (true);

-- ==========================================
-- 6. PROMO CODE USAGE
-- ==========================================
CREATE TABLE IF NOT EXISTS promo_code_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(promo_code_id, user_id)
);

ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_promo_usage" ON promo_code_usage;
CREATE POLICY "admin_all_promo_usage" ON promo_code_usage FOR ALL
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "select_own_usage" ON promo_code_usage;
CREATE POLICY "select_own_usage" ON promo_code_usage FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_usage" ON promo_code_usage;
CREATE POLICY "insert_own_usage" ON promo_code_usage FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 7. CLIENT ACCESS (mod uchun)
-- ==========================================
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
CREATE POLICY "public_select_client_access" ON client_access FOR SELECT USING (true);

DROP POLICY IF EXISTS "authenticated_upsert_client_access" ON client_access;
CREATE POLICY "authenticated_upsert_client_access" ON client_access FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "authenticated_update_client_access" ON client_access;
CREATE POLICY "authenticated_update_client_access" ON client_access FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 8. STORAGE: receipts
-- ==========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "upload_own_receipt" ON storage.objects;
CREATE POLICY "upload_own_receipt" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'receipts' AND auth.uid() = (storage.foldername(name))[1]::uuid
  );

DROP POLICY IF EXISTS "read_receipts" ON storage.objects;
CREATE POLICY "read_receipts" ON storage.objects FOR SELECT
  TO public USING (bucket_id = 'receipts');

-- ==========================================
-- 9. TRIGGER: yangi user uchun profil
-- ==========================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- ==========================================
-- 10. PLANS: to'g'ri narxlar
-- ==========================================
DELETE FROM plans;

INSERT INTO plans (code, name, duration_days, price, sort_order, is_active) VALUES
  ('7days', '7 Kunlik', 7, 50000, 1, true),
  ('30days', '30 Kunlik', 30, 150000, 2, true),
  ('90days', '90 Kunlik', 90, 350000, 3, true),
  ('180days', '180 Kunlik', 180, 600000, 4, true),
  ('hwid-reset', 'HWID Yangilash', 0, 50000, 5, true);
