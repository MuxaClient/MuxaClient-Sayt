/*
  Planlarni to'liq yangilash:
  1. 7 Kunlik - 7 kun, 50,000 so'm
  2. 30 Kunlik - 30 kun, 150,000 so'm
  3. 90 Kunlik - 90 kun, 350,000 so'm
  4. 180 Kunlik - 180 kun, 600,000 so'm
  5. HWID Yangilash - bir martalik, 50,000 so'm
*/

-- Eski planlarni tozalash
DELETE FROM promo_code_usage WHERE promo_code_id IN (SELECT id FROM promo_codes);
DELETE FROM promo_codes;
DELETE FROM receipts;
DELETE FROM subscriptions;
DELETE FROM plans;

-- Yangi planlarni qo'shish
INSERT INTO plans (code, name, duration_days, price, sort_order, is_active) VALUES
  ('7days', '7 Kunlik', 7, 50000, 1, true),
  ('30days', '30 Kunlik', 30, 150000, 2, true),
  ('90days', '90 Kunlik', 90, 350000, 3, true),
  ('180days', '180 Kunlik', 180, 600000, 4, true),
  ('hwid-reset', 'HWID Yangilash', 0, 50000, 5, true);
