-- Add employee identity fields to customer accounts.
-- Employee code is editable but must remain unique.

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS employee_code TEXT;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS department TEXT;

UPDATE customers
SET employee_code = COALESCE(employee_code, 'EMP-' || UPPER(SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 8)));

UPDATE customers
SET department = COALESCE(NULLIF(TRIM(department), ''), 'General');

ALTER TABLE customers
ALTER COLUMN employee_code SET NOT NULL;

ALTER TABLE customers
ALTER COLUMN department SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'customers_employee_code_key'
  ) THEN
    ALTER TABLE customers ADD CONSTRAINT customers_employee_code_key UNIQUE (employee_code);
  END IF;
END $$;
