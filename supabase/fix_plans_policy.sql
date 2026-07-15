-- Plans jadvalini hamma (anon + authenticated) o'qishi mumkin qilish
DROP POLICY IF EXISTS "read_plans" ON plans;
CREATE POLICY "read_plans" ON plans FOR SELECT USING (true);
