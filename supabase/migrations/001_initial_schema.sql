-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id          UUID          DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        VARCHAR(255)  NOT NULL,
  description TEXT,
  price       DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ   DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow read for everyone (adjust as needed)
CREATE POLICY "Allow read for all" ON products
  FOR SELECT USING (true);

-- Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated" ON products
  FOR ALL USING (auth.role() = 'authenticated');

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data
INSERT INTO products (name, description, price) VALUES
  ('Camiseta Básica',  'Camiseta 100% algodão, disponível em várias cores', 49.90),
  ('Calça Jeans',      'Calça slim fit, lavagem escura',                   129.90),
  ('Vestido Floral',   'Vestido leve com estampa floral, ideal para o verão', 89.90);
