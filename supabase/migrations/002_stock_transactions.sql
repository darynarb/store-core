-- Add category and quantity to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 0;

-- Update existing sample data with categories
UPDATE products SET category = 'Camisetas', quantity = 10 WHERE name = 'Camiseta Básica';
UPDATE products SET category = 'Calças',    quantity = 5  WHERE name = 'Calça Jeans';
UPDATE products SET category = 'Conjuntos', quantity = 8  WHERE name = 'Vestido Floral';

-- Transactions table (venda, troca, entrada, saida)
CREATE TABLE IF NOT EXISTS transactions (
  id           UUID          DEFAULT uuid_generate_v4() PRIMARY KEY,
  type         VARCHAR(20)   NOT NULL CHECK (type IN ('venda', 'troca', 'entrada', 'saida')),
  product_id   UUID          REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255)  NOT NULL,
  category     VARCHAR(100),
  quantity     INTEGER       NOT NULL DEFAULT 1,
  unit_price   DECIMAL(10,2) NOT NULL DEFAULT 0,
  total        DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes        TEXT,
  created_at   TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all" ON transactions
  FOR SELECT USING (true);

CREATE POLICY "Allow all for authenticated" ON transactions
  FOR ALL USING (auth.role() = 'authenticated');