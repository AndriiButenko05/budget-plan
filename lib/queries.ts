import type { SupabaseClient } from "@supabase/supabase-js";
import { monthRange } from "@/lib/dates";
import type { Budget, Category, ExpenseRow, Profile, WishlistItem } from "@/lib/types";

/**
 * Тягнемо лише потрібні колонки: note і created_at у списках не показуємо
 * як окремі дані, а зайві байти множаться на кожен рядок.
 * Джойн профілю саме через attributed_to — FK до profiles тепер два.
 */
const EXPENSE_SELECT =
  "id,user_id,attributed_to,category_id,amount,spent_at,note," +
  "category:categories(id,name,icon,color)," +
  "owner:profiles!expenses_attributed_to_fkey(id,name,color)";

/** Для графіків підписи не потрібні — беремо тільки числа. */
const EXPENSE_SELECT_LEAN = "id,attributed_to,category_id,amount,spent_at";

/** Витрати за діапазон дат (включно), найновіші першими. */
export async function getExpensesBetween(
  supabase: SupabaseClient,
  from: string,
  to: string,
  { lean = false } = {},
): Promise<ExpenseRow[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select(lean ? EXPENSE_SELECT_LEAN : EXPENSE_SELECT)
    .gte("spent_at", from)
    .lte("spent_at", to)
    .order("spent_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return normalizeExpenses(data);
}

/** Витрати за місяць «YYYY-MM». */
export async function getMonthExpenses(
  supabase: SupabaseClient,
  monthKey: string,
  options?: { lean?: boolean },
) {
  const [from, to] = monthRange(monthKey);
  return getExpensesBetween(supabase, from, to, options);
}

/**
 * Тільки сума за місяць. Дашборд показує минулий місяць одним числом,
 * тягнути для цього всі рядки з джойнами немає сенсу.
 */
export async function getMonthTotal(supabase: SupabaseClient, monthKey: string) {
  const [from, to] = monthRange(monthKey);

  const { data, error } = await supabase
    .from("expenses")
    .select("amount")
    .gte("spent_at", from)
    .lte("spent_at", to);

  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
}

export async function getCategories(
  supabase: SupabaseClient,
  { includeArchived = false } = {},
): Promise<Category[]> {
  let query = supabase
    .from("categories")
    .select("id,name,icon,color,sort_order,is_archived");
  if (!includeArchived) query = query.eq("is_archived", false);

  const { data, error } = await query
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getProfiles(supabase: SupabaseClient): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,name,color,created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Ліміти на конкретний місяць «YYYY-MM». */
export async function getBudgets(
  supabase: SupabaseClient,
  monthKey: string,
): Promise<Budget[]> {
  const { data, error } = await supabase
    .from("budgets")
    .select("id,category_id,month,limit_amount")
    .eq("month", `${monthKey}-01`);

  if (error) throw error;
  return (data ?? []).map((b) => ({ ...b, limit_amount: Number(b.limit_amount) }));
}

export async function getWishlist(supabase: SupabaseClient): Promise<WishlistItem[]> {
  const { data, error } = await supabase
    .from("wishlist_items")
    // Один рядок навмисно: Supabase виводить типи лише з літерала.
    .select(
      "id,created_by,for_whom,title,url,note,price,currency,image_path,image_position,status,created_at",
    )
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((item) => ({
    ...item,
    price: item.price === null ? null : Number(item.price),
  }));
}

/** PostgREST може віддати numeric рядком — зводимо суми до чисел. */
function normalizeExpenses(rows: unknown[] | null): ExpenseRow[] {
  return ((rows ?? []) as ExpenseRow[]).map((row) => ({
    ...row,
    amount: Number(row.amount),
  }));
}
