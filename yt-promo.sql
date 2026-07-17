-- =============================================
-- YT PROMO SYSTEM
-- YouTuberlar uchun maxsus promo kodlar
-- =============================================

-- 1. Jadval yaratish
CREATE TABLE IF NOT EXISTS yt_promos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  youtuber_name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  max_uses INTEGER DEFAULT 0,  -- 0 = cheksiz
  current_uses INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. RLS
ALTER TABLE yt_promos ENABLE ROW LEVEL SECURITY;

-- Admin barcha CRUD
CREATE POLICY "admin_full_access_yt_promos" ON yt_promos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM client_access WHERE user_id = auth.uid() AND is_admin = true)
  );

-- Har kim aktiv promolarni o'qishi mumkin
CREATE POLICY "public_read_active_promos" ON yt_promos
  FOR SELECT USING (active = true);

-- 3. Promo kod tekshirish RPC
CREATE OR REPLACE FUNCTION validate_yt_promo(p_code TEXT)
RETURNS TABLE (
  valid BOOLEAN,
  discount_percent INTEGER,
  youtuber_name TEXT,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  promo_record RECORD;
BEGIN
  SELECT * INTO promo_record
  FROM yt_promos
  WHERE code = UPPER(TRIM(p_code))
    AND active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, ''::TEXT, 'Promo kod topilmadi yoki faol emas';
    RETURN;
  END IF;

  IF promo_record.max_uses > 0 AND promo_record.current_uses >= promo_record.max_uses THEN
    RETURN QUERY SELECT false, 0, ''::TEXT, 'Promo kod limiti tugagan';
    RETURN;
  END IF;

  RETURN QUERY SELECT true, promo_record.discount_percent, promo_record.youtuber_name, 'Promo kod qabul qilindi!';
END;
$$;

-- 4. Promo ishlatilganini yangilash RPC
CREATE OR REPLACE FUNCTION use_yt_promo(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE yt_promos
  SET current_uses = current_uses + 1
  WHERE code = UPPER(TRIM(p_code))
    AND active = true
    AND (max_uses = 0 OR current_uses < max_uses);

  RETURN FOUND;
END;
$$;

-- 5. Promo yaratish RPC (admin uchun)
CREATE OR REPLACE FUNCTION create_yt_promo(
  p_youtuber_name TEXT,
  p_code TEXT,
  p_discount_percent INTEGER,
  p_max_uses INTEGER DEFAULT 0
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO yt_promos (youtuber_name, code, discount_percent, max_uses, created_by)
  VALUES (p_youtuber_name, UPPER(TRIM(p_code)), p_discount_percent, p_max_uses, auth.uid());

  RETURN 'Promo kod yaratildi';
EXCEPTION
  WHEN unique_violation THEN
    RETURN 'Bu promo kod allaqachon mavjud';
END;
$$;

-- 6. Promo o'chirish/deaktivatsiya RPC
CREATE OR REPLACE FUNCTION delete_yt_promo(p_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM yt_promos WHERE id = p_id;
  RETURN 'Promo kod o''chirildi';
END;
$$;

-- 7. Test uchun namuna
-- INSERT INTO yt_promos (youtuber_name, code, discount_percent, max_uses) VALUES ('TestYoutuber', 'TEST20', 20, 100);
