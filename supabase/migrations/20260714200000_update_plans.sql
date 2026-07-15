/*
# Tarif rejalarini yangilash

Eski rejalarni yangilash (DELETE emas, chunki FK constraints bor):

1. 7 Kunlik - 7 kun, 50,000 so'm (eski 1month)
2. 30 Kunlik - 30 kun, 150,000 so'm (eski 3month)
3. 90 Kunlik - 90 kun, 350,000 so'm (eski 6month)
4. 180 Kunlik - 180 kun, 600,000 so'm (eski lifetime)
5. HWID Yangilash - bir martalik, 50,000 so'm (yangi)
*/

-- Mavjud rejalarni yangilash (DELETE emas, FK constraint sabab)
UPDATE plans SET name = '7 Kunlik', code = '7days', duration_days = 7, price = 50000, sort_order = 1, is_active = true WHERE code = '1month';
UPDATE plans SET name = '30 Kunlik', code = '30days', duration_days = 30, price = 150000, sort_order = 2, is_active = true WHERE code = '3month';
UPDATE plans SET name = '90 Kunlik', code = '90days', duration_days = 90, price = 350000, sort_order = 3, is_active = true WHERE code = '6month';
UPDATE plans SET name = '180 Kunlik', code = '180days', duration_days = 180, price = 600000, sort_order = 4, is_active = true WHERE code = 'lifetime';

-- HWID Yangilash — yangi qo'shiladi
INSERT INTO plans (code, name, duration_days, price, sort_order, is_active)
VALUES ('hwid-reset', 'HWID Yangilash', 0, 50000, 5, true)
ON CONFLICT (code) DO NOTHING;
