-- Allow all operations for anon role (internal tool, no auth required)
CREATE POLICY "Allow all for anon" ON products
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for anon" ON transactions
  FOR ALL TO anon USING (true) WITH CHECK (true);
