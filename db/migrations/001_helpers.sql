-- Shared helpers used by every subsequent migration.
-- Intentionally avoids CREATE EXTENSION (postgis, vector, pgcrypto): Render's
-- free-tier Postgres may not permit them, and gen_random_uuid() has been a
-- built-in core function (no extension required) since Postgres 13.

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
