/*
# Promo kodlar tizimi

## Yangi jadvallar

1. **promo_codes** — admin tomonidan yaratilgan promo kodlar
2. **promo_code_usage** — promo kod ishlatilganligini kuzatish

## Xususiyatlari

- Har bir promo kod faqat 24 soat ishlaydi
- Har bir akkount faqat 1 marta ishlata oladi
- Promo kod obunalarga qo'llaniladi
*/

-- ============================================================
-- PROMO CODES jadvali
-- ============================================================
CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  max_uses int NOT NULL DEFAULT 1 CHECK (max_uses > 0),
  used_count int NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  expires_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_expires_at ON promo_codes(expires_at);

DROP POLICY IF EXISTS "admin_all_promo_codes" ON promo_codes;
CREATE POLICY "admin_all_promo_codes" ON promo_codes FOR ALL
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "read_active_promo_codes" ON promo_codes;
CREATE POLICY "read_active_promo_codes" ON promo_codes FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- PROMO CODE USAGE jadvali
-- ============================================================
CREATE TABLE IF NOT EXISTS promo_code_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(promo_code_id, user_id)
);

ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_promo_code_usage_user ON promo_code_usage(user_id);

DROP POLICY IF EXISTS "admin_all_promo_usage" ON promo_code_usage;
CREATE POLICY "admin_all_promo_usage" ON promo_code_usage FOR ALL
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "select_own_usage" ON promo_code_usage;
CREATE POLICY "select_own_usage" ON promo_code_usage FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_usage" ON promo_code_usage;
CREATE POLICY "insert_own_usage" ON promo_code_usage FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
