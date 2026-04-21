-- pgcrypto for SHA-256 hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_users (
  id            UUID          DEFAULT uuid_generate_v4() PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash TEXT          NOT NULL,
  role          VARCHAR(20)   NOT NULL CHECK (role IN ('root', 'owner', 'workforce')),
  active        BOOLEAN       NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON app_users FOR ALL TO anon USING (true) WITH CHECK (true);

-- Default root user  (password: admin123)
INSERT INTO app_users (name, email, password_hash, role)
VALUES ('Root', 'root@stilotop.com', encode(digest('admin123', 'sha256'), 'hex'), 'root');
