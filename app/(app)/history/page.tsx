import AddExpenseButton from "@/components/add-expense-button";
import CategoryBars from "@/components/category-bars";
import ExpenseList from "@/components/expense-list";
import ExportCsvButton from "@/components/export-csv-button";
import FilterBar from "@/components/filter-bar";
import { byCategory, total } from "@/lib/aggregate";
import { requireProfile } from "@/lib/auth";
import { normalizeMonthKey } from "@/lib/dates";
import { formatMoney, formatMonthYear } from "@/lib/format";
import { getCategories, getMonthExpenses, getProfiles } from "@/lib/queries";

export const metadata = { title: "Історія — Наш бюджет" };

export default async function HistoryPage(props: PageProps<"/history">) {
  const { supabase } = await requireProfile();
  const searchParams = await props.searchParams;

  const month = normalizeMonthKey(asString(searchParams.month));
  const categoryFilter = asString(searchParams.category);
  const userFilter = asString(searchParams.user);

  const [allExpenses, categories, profiles] = await Promise.all([
    getMonthExpenses(supabase, month),
    getCategories(supabase, { includeArchived: true }),
    getProfiles(supabase),
  ]);

  const expenses = allExpenses.filter(
    (expense) =>
      (!categoryFilter || expense.category_id === categoryFilter) &&
      (!userFilter || expense.user_id === userFilter),
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-lg font-semibold">Історія</h1>
        <ExportCsvButton expenses={expenses} filename={`budget-${month}.csv`} />
      </div>

      <FilterBar month={month} categories={categories} profiles={profiles} />

      <section className="card flex items-baseline gap-3 p-5">
        <div className="mr-auto">
          <p className="text-xs uppercase tracking-wide text-muted">
            {formatMonthYear(`${month}-01`)}
          </p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {formatMoney(total(expenses))}
          </p>
        </div>
        <p className="text-xs text-muted">{expenses.length} записів</p>
      </section>

      {expenses.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-4 text-sm font-semibold">Розподіл за місяць</h2>
          <CategoryBars slices={byCategory(expenses, categories)} />
        </section>
      )}

      <ExpenseList
        expenses={expenses}
        categories={categories.filter((c) => !c.is_archived)}
        grouped
        emptyText="За цей місяць записів немає"
      />

      <AddExpenseButton categories={categories.filter((c) => !c.is_archived)} />
    </div>
  );
}

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
