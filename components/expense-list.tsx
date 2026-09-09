"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import ExpenseDialog from "@/components/expense-dialog";
import { deleteExpense } from "@/lib/actions/expenses";
import { formatDayMonth, formatMoney } from "@/lib/format";
import type { Category, ExpenseRow } from "@/lib/types";

type Props = {
  expenses: ExpenseRow[];
  categories: Category[];
  /** Розбивати на групи з заголовком-датою. */
  grouped?: boolean;
  emptyText?: string;
};

export default function ExpenseList({
  expenses,
  categories,
  grouped = false,
  emptyText = "Записів немає",
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<ExpenseRow | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function remove(expense: ExpenseRow) {
    if (!confirm(`Видалити витрату на ${formatMoney(expense.amount)}?`)) return;

    setPendingId(expense.id);
    startTransition(async () => {
      await deleteExpense(expense.id);
      setPendingId(null);
      router.refresh();
    });
  }

  if (expenses.length === 0) {
    return <p className="px-1 py-8 text-center text-sm text-muted">{emptyText}</p>;
  }

  const groups = grouped
    ? [...groupByDate(expenses)]
    : [["", expenses] as [string, ExpenseRow[]]];

  return (
    <>
      <div className="space-y-5">
        {groups.map(([date, rows]) => (
          <div key={date || "all"}>
            {date && (
              <div className="mb-2 flex items-baseline justify-between px-1">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
                  {formatDayMonth(date)}
                </h3>
                <span className="text-xs tabular-nums text-muted">
                  {formatMoney(rows.reduce((sum, r) => sum + r.amount, 0))}
                </span>
              </div>
            )}

            <ul className="card divide-y divide-line overflow-hidden">
              {rows.map((expense) => (
                <li
                  key={expense.id}
                  className={`group flex items-center gap-3 px-3 py-2.5 transition-opacity ${
                    pendingId === expense.id ? "opacity-40" : ""
                  }`}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base"
                    style={{
                      background: `color-mix(in srgb, ${expense.category?.color ?? "#94a3b8"} 22%, transparent)`,
                    }}
                    aria-hidden
                  >
                    {expense.category?.icon ?? "📦"}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {expense.category?.name ?? "Без категорії"}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {expense.author && (
                        <span style={{ color: expense.author.color }}>
                          {expense.author.name}
                        </span>
                      )}
                      {expense.note && ` · ${expense.note}`}
                      {!grouped && ` · ${formatDayMonth(expense.spent_at)}`}
                    </p>
                  </div>

                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatMoney(expense.amount)}
                  </span>

                  <div className="flex shrink-0 gap-0.5">
                    <button
                      type="button"
                      onClick={() => setEditing(expense)}
                      aria-label="Редагувати"
                      className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-accent"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(expense)}
                      aria-label="Видалити"
                      className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <ExpenseDialog
        key={editing?.id ?? "none"}
        open={editing !== null}
        onClose={() => setEditing(null)}
        categories={categories}
        expense={editing ?? undefined}
      />
    </>
  );
}

/** Список уже відсортований за датою — просто ріжемо на послідовні групи. */
function groupByDate(expenses: ExpenseRow[]) {
  const map = new Map<string, ExpenseRow[]>();
  for (const expense of expenses) {
    const bucket = map.get(expense.spent_at);
    if (bucket) bucket.push(expense);
    else map.set(expense.spent_at, [expense]);
  }
  return map;
}
