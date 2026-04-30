export interface ExpenseType {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Unit {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Category {
  id: string;
  unit_id: string;
  name: string;
  created_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  created_at: string;
}

export interface Expense {
  id: string;
  expense_type_id?: string;
  unit_id?: string;
  category_id?: string;
  subcategory_id?: string;
  value: number;
  observation: string;
  date: string;
  payment_method?: string | null;
  created_at: string;
  expense_types?: ExpenseType;
  units?: Unit;
  categories?: Category;
  subcategories?: Subcategory;
}

export interface ExpenseWithType extends Expense {
  expense_types: ExpenseType;
}

export interface ExpenseWithDetails extends Expense {
  units?: Unit;
  categories?: Category;
  subcategories?: Subcategory;
}

export interface Revenue {
  id: string;
  unit_id?: string;
  category_id?: string;
  subcategory_id?: string;
  value: number;
  observation: string;
  date: string;
  payment_method?: string | null;
  created_at: string;
  units?: Unit;
  categories?: Category;
  subcategories?: Subcategory;
}

export type ActiveView = 'dashboard' | 'launch-expense' | 'launch-revenue';
