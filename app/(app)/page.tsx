import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import AddExpenseButton from "@/components/add-expense-button";
import CategoryBars from "@/components/category-bars";
import ExpenseList from "@/components/expense-list";
import { byCategory, byOwner, total } from "@/lib/aggregate";
import { requireProfile } from "@/lib/auth";
import { currentMonthKey, shiftMonth } from "@/lib/dates";
import { formatMoney, formatMonthYear } from "@/lib/format";
import {
  getBudgets,
  getCategories,
  getMonthExpenses,
  getMonthTotal,
  getProfiles,
} from "@/lib/queries";

export default async function DashboardPage() {
  const { supabase } = await requireProfile();

  const month = currentMonthKey();
  const previousMonth = shiftMonth(month, -1);

  const [expenses, spentBefore, categories, profiles, budgets] = await Promise.all([
    getMonthExpenses(supabase, month),
    getMonthTotal(supabase, previousMonth),
    getCategories(supabase),
    getProfiles(supabase),
    getBudgets(supabase, month),
  ]);

  const spent = total(expenses);
  const change = spentBefore > 0 ? (spent - spentBefore) / spentBefore : null;
  const owners = byOwner(expenses, profiles);
  const limits = new Map(budgets.map((b) => [b.category_id, b.limit_amount]));
  const monthLimit = budgets.reduce((sum, b) => sum + b.limit_amount, 0);

  return (
    <div className="space-y-5">
      <section className="card rise p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {formatMonthYear(`${month}-01`)}
        </p>
        <p className="mt-1 text-4xl font-semibold tabular-nums">{formatMoney(spent)}</p>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          {change !== null && (
            <span
              className={`flex items-center gap-1 ${
                change > 0 ? "text-danger" : "text-ok"
              }`}
            >
              {change > 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {Math.abs(Math.round(change * 100))}% проти минулого місяця
            </span>
          )}
          {monthLimit > 0 && (
            <span className="text-muted">
              Ліміт: {formatMoney(monthLimit)}
              {spent > monthLimit && (
                <span className="text-danger"> · перевищено</span>
              )}
            </span>
          )}
          <span className="text-muted">{expenses.length} записів</span>
        </div>

        {owners.length > 0 && spent > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex h-2 overflow-hidden rounded-full bg-surface-2">
              {owners.map((owner) => (
                <div
                  key={owner.id}
                  style={{ width: `${owner.share * 100}%`, background: owner.color }}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {owners.map((owner) => (
                <span key={owner.id} className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: owner.color }}
                    aria-hidden
                  />
                  {owner.name}
                  <span className="font-medium tabular-nums">
                    {formatMoney(owner.total)}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold">По категоріях</h2>
        <CategoryBars slices={byCategory(expenses, categories)} limits={limits} />
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold">Останні витрати</h2>
          <div className="hidden md:block">
            <AddExpenseButton
              categories={categories}
              profiles={profiles}
              variant="inline"
            />
          </div>
        </div>
        <ExpenseList
          expenses={expenses.slice(0, 10)}
          categories={categories}
          profiles={profiles}
          emptyText="Цього місяця витрат ще немає — додай першу"
        />
      </section>

      <div className="md:hidden">
        <AddExpenseButton categories={categories} profiles={profiles} />
      </div>
    </div>
  );
}
