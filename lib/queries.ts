import type { SupabaseClient } from "@supabase/supabase-js";
import { monthRange } from "@/lib/dates";
import type { Budget, Category, ExpenseRow, Profile, WishlistItem } from "@/lib/types";

const EXPENSE_SELECT =
  "*, category:categories(id,name,icon,color), author:profiles(id,name,color)";

/** Витрати за діапазон дат (включно), найновіші першими. */
export async function getExpensesBetween(
  supabase: SupabaseClient,
  from: string,
  to: string,
): Promise<ExpenseRow[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select(EXPENSE_SELECT)
    .gte("spent_at", from)
    .lte("spent_at", to)
    .order("spent_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return normalizeExpenses(data);
}

/** Витрати за місяць «YYYY-MM». */
export async function getMonthExpenses(supabase: SupabaseClient, monthKey: string) {
  const [from, to] = monthRange(monthKey);
  return getExpensesBetween(supabase, from, to);
}

export async function getCategories(
  supabase: SupabaseClient,
  { includeArchived = false } = {},
): Promise<Category[]> {
  let query = supabase.from("categories").select("*");
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
    .select("*")
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
    .select("*")
    .eq("month", `${monthKey}-01`);

  if (error) throw error;
  return (data ?? []).map((b) => ({ ...b, limit_amount: Number(b.limit_amount) }));
}

export async function getWishlist(supabase: SupabaseClient): Promise<WishlistItem[]> {
  const { data, error } = await supabase
    .from("wishlist_items")
    .select("*")
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
