/*
  # Add type column to categories

  ## Summary
  Separates categories by usage context so expense categories are not shown
  when creating revenues and vice versa.

  ## Changes

  ### categories table
  - Added `type` column (text, default 'expense') - can be 'expense' or 'revenue'
  - Existing categories without a type will default to 'expense'

  ## Notes
  1. New categories created in the expense form will be type='expense'
  2. New categories created in the revenue form will be type='revenue'
  3. Existing data is preserved; old categories default to 'expense'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'type'
  ) THEN
    ALTER TABLE categories ADD COLUMN type text NOT NULL DEFAULT 'expense';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
