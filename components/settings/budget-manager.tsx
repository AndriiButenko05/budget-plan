"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { setBudget } from "@/lib/actions/settings";
import { idle } from "@/lib/actions/shared";
import { formatMonthYear } from "@/lib/format";
import type { Budget, Category } from "@/lib/types";

type Props = {
  categories: Category[];
  budgets: Budget[];
  /** «YYYY-MM» — місяць, для якого діють ліміти. */
  month: string;
};

export default function BudgetManager({ categories, budgets, month }: Props) {
  const limits = new Map(budgets.map((b) => [b.category_id, b.limit_amount]));

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        Ліміти діють на {formatMonthYear(`${month}-01`)}. Порожнє поле — без ліміту.
      </p>
      <ul className="space-y-2">
        {categories.map((category) => (
          <li key={category.id}>
            <BudgetRow
              category={category}
              month={month}
              limit={limits.get(category.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function BudgetRow({
  category,
  month,
  limit,
}: {
  category: Category;
  month: string;
  limit?: number;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(setBudget, idle);
  const initial = limit !== undefined ? String(limit) : "";
  const [value, setValue] = useState(initial);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  const dirty = value.trim() !== initial;

  return (
    <form
      action={formAction}
      className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2"
    >
      <input type="hidden" name="category_id" value={category.id} />
      <input type="hidden" name="month" value={month} />

      <span aria-hidden>{category.icon}</span>
      <span className="mr-auto truncate text-sm">{category.name}</span>

      <input
        name="limit_amount"
        type="text"
        inputMode="decimal"
        aria-label={`Ліміт для «${category.name}»`}
        placeholder="—"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="field w-24 text-right tabular-nums"
      />
      <span className="text-xs text-muted">zł</span>

      <button
        type="submit"
        aria-label="Зберегти ліміт"
        disabled={pending || !dirty}
        className="rounded-lg p-1.5 text-muted transition-colors enabled:hover:text-accent disabled:opacity-30"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className={`h-4 w-4 ${state.ok && !dirty ? "text-ok" : ""}`} />
        )}
      </button>

      {state.error && <p className="w-full text-sm text-danger">{state.error}</p>}
    </form>
  );
}
