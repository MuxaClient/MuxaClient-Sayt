-- ============================================
-- MUXACLIENT DATABASE — TOZA MIGRATION
-- Supabase SQL Editor da ishga tushiring
-- ============================================

-- 0. ESKI MA'LUMOTLARNI TOZALASH
-- ============================================
DELETE FROM promo_code_usage;
DELETE FROM promo_codes;
DELETE FROM receipts;
DELETE FROM subscriptions;

-- 1. PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  hwid text,
  is_admin boolean NOT NULL DEFAULT false,
  is_blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
DROP POLICY IF EXISTS "admin_select_profiles" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
DROP POLICY IF EXISTS "admin_update_profiles" ON profiles;
DROP POLICY IF EXISTS "admin_delete_profile" ON profiles;
DROP POLICY IF EXISTS "insert_profile" ON profiles;

CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  USING (true);

CREATE POLICY "insert_profile" ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "admin_update_profiles" ON profiles FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "admin_delete_profile" ON profiles FOR DELETE
  USING (is_admin());

-- 2. IS_ADMIN FUNCTION
-- ============================================
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

-- 3. PLANS
-- ============================================
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
CREATE POLICY "read_plans" ON plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_all_plans" ON plans;
CREATE POLICY "admin_all_plans" ON plans FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 4. SUBSCRIPTIONS
-- ============================================
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
  USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "admin_all_subscriptions" ON subscriptions;
CREATE POLICY "admin_all_subscriptions" ON subscriptions FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- 5. RECEIPTS
-- ============================================
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
  USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "insert_own_receipt" ON receipts;
CREATE POLICY "insert_own_receipt" ON receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_all_receipts" ON receipts;
CREATE POLICY "admin_all_receipts" ON receipts FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- 6. PROMO CODES
-- ============================================
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
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "read_active_promo_codes" ON promo_codes;
CREATE POLICY "read_active_promo_codes" ON promo_codes FOR SELECT
  USING (true);

-- 7. PROMO CODE USAGE — FAQAT ADMIN + RPC
-- ============================================
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
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "select_own_usage" ON promo_code_usage;
CREATE POLICY "select_own_usage" ON promo_code_usage FOR SELECT
  USING (true);

-- FOYDALANUVCHILAR TO'G'RIDAN-TO'G'RI INSERT OLAMAYDI!
-- Faqat use_promo_code RPC orqali INSERT mumkin

-- 8. CLIENT ACCESS
-- ============================================
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
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "authenticated_update_client_access" ON client_access;
CREATE POLICY "authenticated_update_client_access" ON client_access FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_full_client_access" ON client_access;
CREATE POLICY "admin_full_client_access" ON client_access FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- 9. HANDLE NEW USER TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = NEW.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 10. USE_PROMO_CODE — ATOMIK FUNCTION
-- SELECT FOR UPDATE bilan, race condition yo'q
-- ============================================
CREATE OR REPLACE FUNCTION use_promo_code(p_code text, p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_promo record;
  v_plan record;
  v_already_used boolean;
  v_end_date timestamptz;
BEGIN
  SELECT * INTO v_promo
  FROM promo_codes
  WHERE code = upper(trim(p_code))
  FOR UPDATE;

  IF v_promo IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'Promokod topilmadi');
  END IF;

  IF NOT v_promo.is_active THEN
    RETURN json_build_object('ok', false, 'error', 'Promokod o''chirilgan');
  END IF;

  IF v_promo.expires_at < now() THEN
    RETURN json_build_object('ok', false, 'error', 'Promokod muddati tugagan');
  END IF;

  IF v_promo.used_count >= v_promo.max_uses THEN
    RETURN json_build_object('ok', false, 'error', 'Promokod to''lgan');
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM promo_code_usage
    WHERE promo_code_id = v_promo.id AND user_id = p_user_id
  ) INTO v_already_used;

  IF v_already_used THEN
    RETURN json_build_object('ok', false, 'error', 'Siz bu promokodni allaqachon ishlatgansiz');
  END IF;

  SELECT * INTO v_plan FROM plans WHERE id = v_promo.plan_id;
  IF v_plan IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'Tarif topilmadi');
  END IF;

  IF v_plan.duration_days = -1 THEN
    v_end_date := '2099-12-31'::timestamptz;
  ELSIF v_plan.duration_days = 0 THEN
    v_end_date := now();
  ELSE
    v_end_date := now() + (v_plan.duration_days || ' days')::interval;
  END IF;

  INSERT INTO subscriptions (user_id, plan_id, status, start_date, end_date)
  VALUES (p_user_id, v_promo.plan_id, 'active', now(), v_end_date);

  INSERT INTO client_access (user_id, subscription_active, subscription_end_date)
  VALUES (p_user_id, true, v_end_date)
  ON CONFLICT (user_id) DO UPDATE
  SET subscription_active = true, subscription_end_date = EXCLUDED.subscription_end_date;

  INSERT INTO promo_code_usage (promo_code_id, user_id)
  VALUES (v_promo.id, p_user_id);

  UPDATE promo_codes SET used_count = used_count + 1 WHERE id = v_promo.id;

  RETURN json_build_object('ok', true, 'plan', v_plan.name, 'end_date', v_end_date);
END;
$$;

GRANT EXECUTE ON FUNCTION use_promo_code(text, uuid) TO authenticated;

-- 11. UPDATE_HWID FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_hwid(p_email text, p_hwid text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE client_access SET hwid = p_hwid, updated_at = now() WHERE email = p_email;
  UPDATE profiles SET hwid = p_hwid WHERE email = p_email;
END;
$$;

-- 12. CLEAR_HWID FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION clear_hwid(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE client_access SET hwid = NULL, updated_at = now() WHERE user_id = p_user_id;
  UPDATE profiles SET hwid = NULL WHERE id = p_user_id;
END;
$$;

-- 13. STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "upload_own_receipt" ON storage.objects;
CREATE POLICY "upload_own_receipt" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts' AND auth.uid() = (storage.foldername(name))[1]::uuid
  );

DROP POLICY IF EXISTS "read_receipts" ON storage.objects;
CREATE POLICY "read_receipts" ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts');

-- 14. PLANS QO'SHISH
-- ============================================
INSERT INTO plans (code, name, duration_days, price, sort_order, is_active) VALUES
  ('7days', '7 Kunlik', 7, 10000, 1, true),
  ('30days', '30 Kunlik', 30, 30000, 2, true),
  ('90days', '90 Kunlik', 90, 60000, 3, true),
  ('180days', '180 Kunlik', 180, 90000, 4, true),
  ('hwid-reset', 'HWID Yangilash', 0, 5000, 5, true),
  ('lifetime', 'Cheksiz Obuna', -1, 120000, 6, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  duration_days = EXCLUDED.duration_days,
  price = EXCLUDED.price,
  sort_order = EXCLUDED.sort_order;

-- 15. ADMIN ACCOUNT
-- ============================================
DO $$
DECLARE
  admin_id uuid := '9e7d5463-36c6-4d25-b8e3-f7290944ce87';
BEGIN
  INSERT INTO profiles (id, email, is_admin)
  VALUES (admin_id, 'muxammaddintairov01@gmail.com', true)
  ON CONFLICT (id) DO UPDATE SET is_admin = true;

  INSERT INTO client_access (user_id, email, username, role, subscription_active, subscription_end_date)
  VALUES (admin_id, 'muxammaddintairov01@gmail.com', 'Admin', 'Admin', true, '2099-12-31T23:59:59Z')
  ON CONFLICT (user_id) DO UPDATE SET
    subscription_active = true,
    subscription_end_date = '2099-12-31T23:59:59Z',
    role = 'Admin';
END $$;

-- TAYYOR!
-- Plans: 6 ta
-- Admin: muxammaddintairov01@gmail.com
-- Promo: yo'q (yangidan yasash kerak)
-- RPC: use_promo_code, update_hwid, clear_hwid
