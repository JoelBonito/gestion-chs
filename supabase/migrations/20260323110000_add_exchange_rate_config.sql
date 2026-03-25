CREATE TABLE IF NOT EXISTS app_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read app_config"
  ON app_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can update app_config"
  ON app_config FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

INSERT INTO app_config (key, value)
VALUES ('brl_eur_rate', '{"rate": 6}')
ON CONFLICT (key) DO NOTHING;
