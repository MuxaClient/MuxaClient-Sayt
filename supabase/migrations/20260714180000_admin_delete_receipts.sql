-- Admin tomonidan cheklarni o'chirish huquqi
DROP POLICY IF EXISTS "admin_delete_receipt" ON receipts;
CREATE POLICY "admin_delete_receipt" ON receipts FOR DELETE
  TO authenticated USING (is_admin());
