import { daysInMonth } from "@/lib/dates";
import type {
  Category,
  Currency,
  ExpenseRow,
  Profile,
  WishlistItem,
} from "@/lib/types";

export type CategorySlice = {
  id: string;
  name: string;
  icon: string;
  color: string;
  total: number;
  share: number;
};

export type UserSlice = {
  id: string;
  name: string;
  color: string;
  total: number;
  share: number;
};

export function total(rows: ExpenseRow[]) {
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

/** Суми по категоріях, від найбільшої. Порожні категорії відкидаємо. */
export function byCategory(rows: ExpenseRow[], categories: Category[]): CategorySlice[] {
  const sums = new Map<string, number>();
  for (const row of rows) {
    sums.set(row.category_id, (sums.get(row.category_id) ?? 0) + row.amount);
  }

  const grand = total(rows);
  const known = new Map(categories.map((c) => [c.id, c]));

  return [...sums.entries()]
    .map(([id, sum]) => {
      const category = known.get(id) ?? rows.find((r) => r.category_id === id)?.category;
      return {
        id,
        name: category?.name ?? "Без категорії",
        icon: category?.icon ?? "📦",
        color: category?.color ?? "#94a3b8",
        total: sum,
        share: grand > 0 ? sum / grand : 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}

/** Суми по кожному з нас — навіть якщо хтось нічого не витратив. */
export function byUser(rows: ExpenseRow[], profiles: Profile[]): UserSlice[] {
  const grand = total(rows);
  const sums = new Map<string, number>();
  for (const row of rows) {
    sums.set(row.user_id, (sums.get(row.user_id) ?? 0) + row.amount);
  }

  return profiles
    .map((p) => {
      const sum = sums.get(p.id) ?? 0;
      return {
        id: p.id,
        name: p.name,
        color: p.color,
        total: sum,
        share: grand > 0 ? sum / grand : 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}

/** Наростаюча сума по днях місяця — для лінійного графіка. */
export function cumulativeByDay(rows: ExpenseRow[], monthKey: string) {
  const perDay = new Array<number>(daysInMonth(monthKey) + 1).fill(0);
  for (const row of rows) {
    const day = Number(row.spent_at.slice(8, 10));
    if (day >= 1 && day < perDay.length) perDay[day] += row.amount;
  }

  let running = 0;
  return perDay.slice(1).map((value, index) => {
    running += value;
    return { day: index + 1, total: Math.round(running * 100) / 100 };
  });
}

/** Сума по кожному місяці зі списку — для стовпчикового графіка. */
export function byMonth(rows: ExpenseRow[], monthKeys: string[]) {
  const sums = new Map<string, number>(monthKeys.map((m) => [m, 0]));
  for (const row of rows) {
    const key = row.spent_at.slice(0, 7);
    if (sums.has(key)) sums.set(key, (sums.get(key) ?? 0) + row.amount);
  }
  return monthKeys.map((month) => ({
    month,
    total: Math.round((sums.get(month) ?? 0) * 100) / 100,
  }));
}

/** Матриця «категорія × людина» — для графіка порівняння. */
export function categoryByUser(
  rows: ExpenseRow[],
  categories: Category[],
  profiles: Profile[],
) {
  return byCategory(rows, categories).map((slice) => {
    const entry: Record<string, string | number> = { name: slice.name };
    for (const p of profiles) {
      entry[p.id] = rows
        .filter((r) => r.category_id === slice.id && r.user_id === p.id)
        .reduce((sum, r) => sum + r.amount, 0);
    }
    return entry;
  });
}

/**
 * Суми позицій вішліста по валютах. Складати PLN з UAH не можна —
 * курсу ми не зберігаємо, тож кожна валюта йде окремим числом.
 * Позиції без ціни просто не враховуються.
 */
export function totalsByCurrency(items: WishlistItem[]) {
  const sums = new Map<Currency, number>();

  for (const item of items) {
    if (item.price === null) continue;
    const currency = item.currency ?? "PLN";
    sums.set(currency, (sums.get(currency) ?? 0) + item.price);
  }

  return [...sums.entries()].sort(([a], [b]) => a.localeCompare(b));
}
