-- Add account_code column to suppliers for per-supplier AP tracking
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS account_code TEXT UNIQUE;

-- Backfill existing suppliers with account codes
DO $$
DECLARE
  s RECORD;
BEGIN
  FOR s IN SELECT id FROM suppliers WHERE account_code IS NULL ORDER BY id LOOP
    UPDATE suppliers SET account_code = '2010-S' || s.id WHERE id = s.id;
  END LOOP;
END $$;
