/*
  # Add Units, Categories, Subcategories and Revenues

  ## Summary
  Extends the expense management system with a 3-level hierarchy and revenue tracking.

  ## New Tables

  ### units (Unidades)
  - `id` (uuid, primary key)
  - `name` (text) - Unit name e.g. "Franquia", "Mentoria", "Sorveteria"
  - `color` (text) - Hex color for visual identification
  - `created_at` (timestamptz)

  ### categories (Categorias por Unidade)
  - `id` (uuid, primary key)
  - `unit_id` (uuid, FK to units) - Parent unit
  - `name` (text) - Category name e.g. "Insumos", "Produto de limpeza"
  - `created_at` (timestamptz)

  ### subcategories (Subcategorias - opcional)
  - `id` (uuid, primary key)
  - `category_id` (uuid, FK to categories) - Parent category
  - `name` (text) - Subcategory name e.g. "Limão", "Hortelã"
  - `created_at` (timestamptz)

  ### revenues (Receitas)
  - Same structure as expenses but for income tracking
  - Links to unit, category, subcategory hierarchy

  ## Modified Tables

  ### expenses
  - Added `unit_id` (nullable FK to units)
  - Added `category_id` (nullable FK to categories)
  - Added `subcategory_id` (nullable FK to subcategories)

  ## Security
  - RLS enabled on all new tables with public anon access (no auth required)

  ## Notes
  1. Old expense_type_id column kept for backward compatibility
  2. New entries should use unit_id/category_id/subcategory_id
  3. Categories are scoped to their parent unit
  4. Subcategories are optional - vary by business type
*/

CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#00D4FF',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public select on units"
  ON units FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert on units"
  ON units FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update on units"
  ON units FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public delete on units"
  ON units FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES units(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public select on categories"
  ON categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert on categories"
  ON categories FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update on categories"
  ON categories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public delete on categories"
  ON categories FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public select on subcategories"
  ON subcategories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert on subcategories"
  ON subcategories FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update on subcategories"
  ON subcategories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public delete on subcategories"
  ON subcategories FOR DELETE TO anon, authenticated USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'unit_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN unit_id uuid REFERENCES units(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN category_id uuid REFERENCES categories(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'subcategory_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN subcategory_id uuid REFERENCES subcategories(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS revenues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES units(id) ON DELETE SET NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id uuid REFERENCES subcategories(id) ON DELETE SET NULL,
  value decimal(10,2) NOT NULL CHECK (value > 0),
  observation text DEFAULT '',
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public select on revenues"
  ON revenues FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert on revenues"
  ON revenues FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update on revenues"
  ON revenues FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public delete on revenues"
  ON revenues FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_categories_unit_id ON categories(unit_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_revenues_date ON revenues(date);
CREATE INDEX IF NOT EXISTS idx_revenues_unit_id ON revenues(unit_id);
CREATE INDEX IF NOT EXISTS idx_expenses_unit_id ON expenses(unit_id);
