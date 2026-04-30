/*
  # Make expense_type_id nullable

  ## Change
  - `expenses.expense_type_id` was NOT NULL, causing insert failures when using
    the new unit/category hierarchy without providing the legacy expense_type_id.
  - This column is now nullable to support new-style inserts.
*/

ALTER TABLE expenses ALTER COLUMN expense_type_id DROP NOT NULL;
