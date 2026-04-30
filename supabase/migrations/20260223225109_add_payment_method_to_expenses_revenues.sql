/*
  # Add payment_method to expenses and revenues

  ## Changes
  - New column `payment_method` (text, nullable) on `expenses` table
  - New column `payment_method` (text, nullable) on `revenues` table

  ## Notes
  - Nullable so existing records are unaffected
  - Values will be one of: Dinheiro, PIX, Cartão de Débito, Cartão de Crédito, Transferência, Boleto
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE expenses ADD COLUMN payment_method text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'revenues' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE revenues ADD COLUMN payment_method text;
  END IF;
END $$;
