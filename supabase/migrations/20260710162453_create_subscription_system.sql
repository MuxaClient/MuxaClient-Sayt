/*
# Muxa Client obuna boshqaruv tizimi

Ushbu migratsiya "Muxa Client" uchun to'liq obona boshqaruv tizimini yaratadi.

## Yangi jadvallar

1. **profiles** — foydalanuvchi profillari (HWID, admin holati, bloklash)
2. **plans** — tarif rejalari (admin tomonidan dinamik boshqariladi)
3. **subscriptions** — foydalanuvchi obunalari
4. **receipts** — to'lov cheklari

## Xavfsizlik (RLS)

- Barcha jadvallarda RLS yoqilgan.
- Adminlik huquqi `profiles.is_admin = true` orqali tekshiriladi.
- `receipts` nomli storage bucket yaratiladi (public read, authenticated write).

## Eslatmalar

1. Trigger `on_auth_user_created` yangi ro'yxatdan o'tgan foydalanuvchi uchun avtomatik profil yaratadi.
2. `is_admin()` funksiyasi SECURITY DEFINER sifatida adminlikni tekshiradi.
*/

-- ============================================================
-- PROFILES jadvali
-- ============================================================
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

-- ============================================================
-- PLANS jadvali
-- ============================================================
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
CREATE POLICY "read_plans" ON plans FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_plan" ON plans;
CREATE POLICY "admin_insert_plan" ON plans FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_plan" ON plans;
CREATE POLICY "admin_update_plan" ON plans FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_plan" ON plans;
CREATE POLICY "admin_delete_plan" ON plans FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- SUBSCRIPTIONS jadvali
-- ============================================================
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
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_subscription" ON subscriptions;
CREATE POLICY "select_own_subscription" ON subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "admin_insert_subscription" ON subscriptions;
CREATE POLICY "admin_insert_subscription" ON subscriptions FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_subscription" ON subscriptions;
CREATE POLICY "admin_update_subscription" ON subscriptions FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_subscription" ON subscriptions;
CREATE POLICY "admin_delete_subscription" ON subscriptions FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- RECEIPTS jadvali
-- ============================================================
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
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_receipt" ON receipts;
CREATE POLICY "select_own_receipt" ON receipts FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "insert_own_receipt" ON receipts;
CREATE POLICY "insert_own_receipt" ON receipts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_receipt" ON receipts;
CREATE POLICY "delete_own_receipt" ON receipts FOR DELETE
  TO authenticated USING (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "admin_update_receipt" ON receipts;
CREATE POLICY "admin_update_receipt" ON receipts FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================
-- BOSHLANG'ICH REJALAR
-- ============================================================
INSERT INTO plans (code, name, duration_days, price, sort_order, is_active)
VALUES
  ('1month', '1 oylik', 30, 20000, 1, true),
  ('3month', '3 oylik', 90, 50000, 2, true),
  ('6month', '6 oylik', 180, 80000, 3, true),
  ('lifetime', 'Cheksiz (Lifetime)', -1, 120000, 4, true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- TRIGGER: yangi foydalanuvchi uchun profil yaratish
-- ============================================================
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

-- ============================================================
-- STORAGE BUCKET: receipts
-- ============================================================
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

DROP POLICY IF EXISTS "admin_delete_receipt_file" ON storage.objects;
CREATE POLICY "admin_delete_receipt_file" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'receipts' AND is_admin());
