import { Budget, Category, Expense } from "../domain/types";

// Simple wrapper so tests can stub if needed
function getStorage(): Storage | undefined {
  try {
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  } catch {}
  // Node test environment: supply a simple in-memory fallback singleton
  const g = globalThis as any;
  if (!g.__memStorage) {
    const store = new Map<string, string>();
    g.__memStorage = {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
      clear: () => void store.clear(),
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      get length() {
        return store.size;
      },
    } as Storage;
  }
  return g.__memStorage as Storage;
}

const STORAGE_KEY = "finance-tracker:v1";

export interface RepositoryState {
  expenses: Expense[];
  categories: Category[];
  budgets: Budget[];
  seeded?: boolean;
}

const UNCATEGORIZED_ID = "uncat";

function readState(): RepositoryState {
  const storage = getStorage();
  const raw = storage?.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as RepositoryState;
      // Ensure Uncategorized exists
      if (!parsed.categories.find((c) => c.id === UNCATEGORIZED_ID)) {
        parsed.categories.unshift({ id: UNCATEGORIZED_ID, name: "Uncategorized", protected: true });
        // Reassign any missing category expenses
        const ids = new Set(parsed.categories.map((c) => c.id));
        parsed.expenses = parsed.expenses.map((e) => (ids.has(e.categoryId) ? e : { ...e, categoryId: UNCATEGORIZED_ID }));
      }
      return parsed;
    } catch {
      // fallthrough to seed
    }
  }
  const seeded = seedState();
  writeState(seeded);
  return seeded;
}

function writeState(state: RepositoryState) {
  const storage = getStorage();
  storage?.setItem(STORAGE_KEY, JSON.stringify(state));
}

function seedState(): RepositoryState {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const month = `${yyyy}-${mm}`;
  const date = `${yyyy}-${mm}-${dd}`;
  const categories: Category[] = [
    { id: UNCATEGORIZED_ID, name: "Uncategorized", protected: true },
    { id: "groceries", name: "Groceries" },
    { id: "transport", name: "Transport" },
    { id: "entertainment", name: "Entertainment" },
  ];
  const expenses: Expense[] = [
    { id: "e1", description: "Apples", amount: 599, date, categoryId: "groceries" },
    { id: "e2", description: "Bus pass", amount: 2500, date, categoryId: "transport" },
  ];
  const budgets: Budget[] = [
    { id: "b1", month, amount: 30000 },
    { id: "b2", month, amount: 15000, categoryId: "groceries" },
  ];
  return { expenses, categories, budgets, seeded: true };
}

function uid(prefix: string = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

// Expenses API
export function listExpenses(): Expense[] {
  return readState().expenses;
}

export function createExpense(input: Omit<Expense, "id">): Expense {
  const state = readState();
  const id = uid("e");
  const ids = new Set(state.categories.map((c) => c.id));
  const categoryId = ids.has(input.categoryId) ? input.categoryId : UNCATEGORIZED_ID;
  const expense: Expense = { id, ...input, categoryId };
  const next = { ...state, expenses: [expense, ...state.expenses] };
  writeState(next);
  return expense;
}

export function updateExpense(id: string, patch: Partial<Omit<Expense, "id">>): Expense | undefined {
  const state = readState();
  const idx = state.expenses.findIndex((e) => e.id === id);
  if (idx === -1) return undefined;
  const ids = new Set(state.categories.map((c) => c.id));
  const current = state.expenses[idx];
  const categoryId = patch.categoryId ? (ids.has(patch.categoryId) ? patch.categoryId : UNCATEGORIZED_ID) : current.categoryId;
  const updated: Expense = { ...current, ...patch, categoryId };
  const next = { ...state, expenses: [...state.expenses] };
  next.expenses[idx] = updated;
  writeState(next);
  return updated;
}

export function deleteExpense(id: string): boolean {
  const state = readState();
  const before = state.expenses.length;
  const next = { ...state, expenses: state.expenses.filter((e) => e.id !== id) };
  writeState(next);
  return next.expenses.length !== before;
}

// Categories API
export function listCategories(): Category[] {
  return readState().categories;
}

export function createCategory(name: string): Category {
  const state = readState();
  const id = uid("c");
  const category: Category = { id, name };
  const next = { ...state, categories: [...state.categories, category] };
  writeState(next);
  return category;
}

export function updateCategory(id: string, patch: Partial<Omit<Category, "id">>): Category | undefined {
  const state = readState();
  const idx = state.categories.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  const current = state.categories[idx];
  if (current.protected) {
    // Protected cannot be renamed or changed
    return current;
  }
  const updated: Category = { ...current, ...patch };
  const next = { ...state, categories: [...state.categories] };
  next.categories[idx] = updated;
  writeState(next);
  return updated;
}

export function deleteCategory(id: string): boolean {
  if (id === UNCATEGORIZED_ID) return false; // cannot delete
  const state = readState();
  const exists = state.categories.some((c) => c.id === id);
  if (!exists) return false;
  const nextCategories = state.categories.filter((c) => c.id !== id);
  // Reassign expenses to Uncategorized
  const reassignedExpenses = state.expenses.map((e) => (e.categoryId === id ? { ...e, categoryId: UNCATEGORIZED_ID } : e));
  const next = { ...state, categories: nextCategories, expenses: reassignedExpenses };
  writeState(next);
  return true;
}

// Budgets API
export function listBudgets(): Budget[] {
  return readState().budgets;
}

export function upsertBudget(input: Omit<Budget, "id"> & { id?: string }): Budget {
  const state = readState();
  const id = input.id ?? uid("b");
  const idx = state.budgets.findIndex((b) => b.id === id);
  const budget: Budget = { id, month: input.month, amount: input.amount, categoryId: input.categoryId };
  let next: RepositoryState;
  if (idx === -1) {
    next = { ...state, budgets: [budget, ...state.budgets] };
  } else {
    next = { ...state, budgets: [...state.budgets] };
    next.budgets[idx] = budget;
  }
  writeState(next);
  return budget;
}

export function clearAll() {
  const storage = getStorage();
  storage?.removeItem(STORAGE_KEY);
}

export const constants = { UNCATEGORIZED_ID };
