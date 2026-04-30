/*
  # Expense Management System - Initial Schema

  ## New Tables

  ### expense_types
  - `id` (uuid, primary key)
  - `name` (text) - Category name e.g. "Aluguel", "Salários"
  - `color` (text) - Hex color for visual identification in charts
  - `created_at` (timestamptz)

  ### expenses
  - `id` (uuid, primary key)
  - `expense_type_id` (uuid, foreign key) - Links to expense_types
  - `value` (decimal 10,2) - Expense amount
  - `observation` (text) - Optional notes
  - `date` (date) - When the expense occurred
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on both tables
  - Public (anon) access allowed since no authentication is required for this app

  ## Notes
  1. expense_types can be deleted only if no expenses reference them
  2. If an expense_type is deleted, related expenses are cascade deleted
  3. color defaults to a blue tone for new categories
*/

CREATE TABLE IF NOT EXISTS expense_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#00D4FF',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expense_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public select on expense_types"
  ON expense_types FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public insert on expense_types"
  ON expense_types FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public update on expense_types"
  ON expense_types FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete on expense_types"
  ON expense_types FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_type_id uuid REFERENCES expense_types(id) ON DELETE CASCADE NOT NULL,
  value decimal(10,2) NOT NULL CHECK (value > 0),
  observation text DEFAULT '',
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public select on expenses"
  ON expenses FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public insert on expenses"
  ON expenses FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public update on expenses"
  ON expenses FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete on expenses"
  ON expenses FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_type_id ON expenses(expense_type_id);
