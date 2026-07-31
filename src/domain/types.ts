// Domain types shared across repository, selectors, hooks and UI
// These are intentionally minimal and framework-agnostic.

// Expense represents a single spending entry recorded by the user.
// - amount: numeric currency value in the app's display currency
// - date: ISO date string (YYYY-MM-DD)
// - categoryId: references Category.id
export interface Expense {
  id: string;
  amount: number; // in display currency units
  date: string; // ISO date (YYYY-MM-DD)
  categoryId: string;
  description?: string;
  createdAt?: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
}

// Category represents a label for classifying expenses.
export interface Category {
  id: string;
  name: string;
  color?: string; // optional HEX color for charts/UI
  protected?: boolean; // system-protected cannot be deleted/renamed
  createdAt?: string;
  updatedAt?: string;
}

// Budget represents a monthly budget, optionally scoped to a category.
// - month: ISO year-month (YYYY-MM)
// - categoryId: if omitted, the budget applies to all categories (global budget)
export interface Budget {
  id: string;
  month: string; // YYYY-MM
  amount: number;
  categoryId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Filters used by selectors/UI to query expenses.
export interface ExpenseFilter {
  dateFrom?: string; // inclusive, YYYY-MM-DD
  dateTo?: string; // inclusive, YYYY-MM-DD
  categoryIds?: string[];
  minAmount?: number;
  maxAmount?: number;
  query?: string; // free-text search over description
}
