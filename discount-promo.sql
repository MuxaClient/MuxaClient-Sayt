-- ============================================
-- CHEGIRMA PROMOKOD TIZIMI
-- Dashboard > SQL Editor da bajaring
-- ============================================

-- 1. exec_sql RPC (kelajakda kerak bo'ladi)
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;

-- 2. promo_codes — discount_percent ustuni
ALTER TABLE promo_codes
  ADD COLUMN IF NOT EXISTS discount_percent int DEFAULT NULL;

-- 3. promo_codes — plan_id NULL qilish
ALTER TABLE promo_codes
  ALTER COLUMN plan_id DROP NOT NULL;

-- 4. receipts — discount_percent
ALTER TABLE receipts
  ADD COLUMN IF NOT EXISTS discount_percent int DEFAULT NULL;

-- 5. receipts — promo_code
ALTER TABLE receipts
  ADD COLUMN IF NOT EXISTS promo_code text DEFAULT NULL;

-- 6. validate_discount_code RPC
CREATE OR REPLACE FUNCTION validate_discount_code(p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_promo record;
BEGIN
  SELECT * INTO v_promo
  FROM promo_codes
  WHERE code = upper(trim(p_code));

  IF v_promo IS NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Promokod topilmadi');
  END IF;

  IF NOT v_promo.is_active THEN
    RETURN json_build_object('valid', false, 'error', 'Promokod o''chirilgan');
  END IF;

  IF v_promo.expires_at < now() THEN
    RETURN json_build_object('valid', false, 'error', 'Promokod muddati tugagan');
  END IF;

  IF v_promo.used_count >= v_promo.max_uses THEN
    RETURN json_build_object('valid', false, 'error', 'Promokod to''lgan');
  END IF;

  IF v_promo.discount_percent IS NULL OR v_promo.discount_percent <= 0 THEN
    RETURN json_build_object('valid', false, 'error', 'Bu chegirma promokod emas');
  END IF;

  RETURN json_build_object(
    'valid', true,
    'discount_percent', v_promo.discount_percent,
    'code', v_promo.code,
    'expires_at', v_promo.expires_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
GRANT EXECUTE ON FUNCTION validate_discount_code(text) TO anon;
GRANT EXECUTE ON FUNCTION validate_discount_code(text) TO authenticated;
