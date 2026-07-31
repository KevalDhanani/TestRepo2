export interface Expense {
  id: string;
  description: string;
  amount: number; // in minor units (e.g., cents)
  date: string; // ISO date string yyyy-mm-dd
  categoryId: string; // references Category.id
}

export interface Category {
  id: string;
  name: string;
  // system-protected category cannot be deleted or renamed
  protected?: boolean;
}

export interface Budget {
  id: string;
  month: string; // yyyy-mm
  amount: number; // in minor units
  categoryId?: string; // optional category-specific budget
}
