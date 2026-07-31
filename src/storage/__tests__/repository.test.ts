import {
  clearAll,
  constants,
  createCategory,
  createExpense,
  deleteCategory,
  deleteExpense,
  listBudgets,
  listCategories,
  listExpenses,
  updateCategory,
  updateExpense,
  upsertBudget,
} from "../repository";

function fresh() {
  clearAll();
  // touch state once to trigger seeding
  listExpenses();
}

describe("repository", () => {
  beforeEach(() => fresh());

  test("seeds demo data on first launch", () => {
    const cats = listCategories();
    const uncat = cats.find((c) => c.id === constants.UNCATEGORIZED_ID);
    expect(uncat?.protected).toBe(true);

    const ex = listExpenses();
    expect(ex.length).toBeGreaterThan(0);

    const budgets = listBudgets();
    expect(budgets.length).toBeGreaterThan(0);
  });

  test("create/update/delete expense persists and validates category", () => {
    const invalid = createExpense({ description: "x", amount: 1, date: "2024-01-01", categoryId: "missing" });
    expect(invalid.categoryId).toBe(constants.UNCATEGORIZED_ID);

    const cat = createCategory("Travel");
    const e = createExpense({ description: "Flight", amount: 50000, date: "2024-02-02", categoryId: cat.id });
    expect(listExpenses().some((x) => x.id === e.id)).toBe(true);

    const updated = updateExpense(e.id, { amount: 60000, categoryId: "nope" });
    expect(updated?.amount).toBe(60000);
    expect(updated?.categoryId).toBe(constants.UNCATEGORIZED_ID);

    const ok = deleteExpense(e.id);
    expect(ok).toBe(true);
    expect(listExpenses().some((x) => x.id === e.id)).toBe(false);
  });

  test("categories protected Uncategorized, reassignment on delete", () => {
    const cats1 = listCategories();
    const uncat = cats1.find((c) => c.id === constants.UNCATEGORIZED_ID)!;
    // cannot update protected
    const res = updateCategory(uncat.id, { name: "Other" });
    expect(res?.name).toBe("Uncategorized");

    // create category and expense
    const c = createCategory("Food");
    const e = createExpense({ description: "Banana", amount: 100, date: "2024-03-03", categoryId: c.id });

    // delete category
    const del = deleteCategory(c.id);
    expect(del).toBe(true);

    // expense should be reassigned to uncat
    const after = listExpenses().find((x) => x.id === e.id)!;
    expect(after.categoryId).toBe(constants.UNCATEGORIZED_ID);
  });

  test("budgets upsert and list", () => {
    const all = listBudgets();
    const first = all[0];
    const upd = upsertBudget({ id: first.id, month: first.month, amount: first.amount + 1000, categoryId: first.categoryId });
    expect(upd.amount).toBe(first.amount + 1000);

    const created = upsertBudget({ month: "2024-04", amount: 20000 });
    expect(listBudgets().some((b) => b.id === created.id)).toBe(true);
  });
});
