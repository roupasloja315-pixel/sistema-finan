/*
  # Add authentication and multi-user support

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users, primary key)
      - `email` (text)
      - `role` (text, 'admin' or 'user', default 'user')
      - `created_at` (timestamptz)

  2. Modified Tables
    - `expenses` - added `user_id` (uuid, references auth.users)
    - `revenues` - added `user_id` (uuid, references auth.users)
    - `units` - added `user_id` (uuid, references auth.users)
    - `categories` - added `user_id` (uuid, references auth.users)
    - `subcategories` - added `user_id` (uuid, references auth.users)
    - `expense_types` - added `user_id` (uuid, references auth.users)

  3. Security
    - All old public (anon) USING(true) policies removed
    - New restrictive policies: each authenticated user can only access their own data
    - Profiles: users can only read/update their own profile
    - All data tables: CRUD restricted to owner via auth.uid() = user_id

  4. Notes
    - user_id columns are nullable to preserve existing data during migration
    - Existing data will be assigned to the first user via edge function
    - Indexes added on user_id columns for performance
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add user_id to expenses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Add user_id to revenues
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'revenues' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE revenues ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Add user_id to units
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'units' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE units ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Add user_id to categories
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE categories ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Add user_id to subcategories
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subcategories' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE subcategories ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Add user_id to expense_types
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expense_types' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE expense_types ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Indexes for user_id
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_revenues_user_id ON revenues(user_id);
CREATE INDEX IF NOT EXISTS idx_units_user_id ON units(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_user_id ON subcategories(user_id);

-- Drop old public policies on expenses
DROP POLICY IF EXISTS "Public select on expenses" ON expenses;
DROP POLICY IF EXISTS "Public insert on expenses" ON expenses;
DROP POLICY IF EXISTS "Public update on expenses" ON expenses;
DROP POLICY IF EXISTS "Public delete on expenses" ON expenses;

-- Drop old public policies on revenues
DROP POLICY IF EXISTS "Public select on revenues" ON revenues;
DROP POLICY IF EXISTS "Public insert on revenues" ON revenues;
DROP POLICY IF EXISTS "Public update on revenues" ON revenues;
DROP POLICY IF EXISTS "Public delete on revenues" ON revenues;

-- Drop old public policies on units
DROP POLICY IF EXISTS "Public select on units" ON units;
DROP POLICY IF EXISTS "Public insert on units" ON units;
DROP POLICY IF EXISTS "Public update on units" ON units;
DROP POLICY IF EXISTS "Public delete on units" ON units;

-- Drop old public policies on categories
DROP POLICY IF EXISTS "Public select on categories" ON categories;
DROP POLICY IF EXISTS "Public insert on categories" ON categories;
DROP POLICY IF EXISTS "Public update on categories" ON categories;
DROP POLICY IF EXISTS "Public delete on categories" ON categories;

-- Drop old public policies on subcategories
DROP POLICY IF EXISTS "Public select on subcategories" ON subcategories;
DROP POLICY IF EXISTS "Public insert on subcategories" ON subcategories;
DROP POLICY IF EXISTS "Public update on subcategories" ON subcategories;
DROP POLICY IF EXISTS "Public delete on subcategories" ON subcategories;

-- Drop old public policies on expense_types
DROP POLICY IF EXISTS "Public select on expense_types" ON expense_types;
DROP POLICY IF EXISTS "Public insert on expense_types" ON expense_types;
DROP POLICY IF EXISTS "Public update on expense_types" ON expense_types;
DROP POLICY IF EXISTS "Public delete on expense_types" ON expense_types;

-- New policies for expenses
CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- New policies for revenues
CREATE POLICY "Users can view own revenues"
  ON revenues FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own revenues"
  ON revenues FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own revenues"
  ON revenues FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own revenues"
  ON revenues FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- New policies for units
CREATE POLICY "Users can view own units"
  ON units FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own units"
  ON units FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own units"
  ON units FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own units"
  ON units FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- New policies for categories
CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- New policies for subcategories
CREATE POLICY "Users can view own subcategories"
  ON subcategories FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subcategories"
  ON subcategories FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subcategories"
  ON subcategories FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subcategories"
  ON subcategories FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- New policies for expense_types
CREATE POLICY "Users can view own expense_types"
  ON expense_types FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expense_types"
  ON expense_types FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expense_types"
  ON expense_types FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expense_types"
  ON expense_types FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
