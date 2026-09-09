"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { toISODate } from "@/lib/dates";
import { type ActionResult, parseAmount, text } from "@/lib/actions/shared";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function refreshAll() {
  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/charts");
}

export async function addExpense(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, profile } = await requireProfile();

  const amount = parseAmount(formData.get("amount"));
  if (amount === null) return { error: "Вкажи суму більше нуля" };

  const categoryId = String(formData.get("category_id") ?? "");
  if (!categoryId) return { error: "Обери категорію" };

  const rawDate = String(formData.get("spent_at") ?? "");
  const spentAt = ISO_DATE.test(rawDate) ? rawDate : toISODate(new Date());

  const { error } = await supabase.from("expenses").insert({
    user_id: profile.id,
    category_id: categoryId,
    amount,
    spent_at: spentAt,
    note: text(formData.get("note")),
  });

  if (error) return { error: "Не вдалося зберегти витрату" };

  refreshAll();
  return { ok: true };
}

export async function updateExpense(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase } = await requireProfile();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Запис не знайдено" };

  const amount = parseAmount(formData.get("amount"));
  if (amount === null) return { error: "Вкажи суму більше нуля" };

  const categoryId = String(formData.get("category_id") ?? "");
  if (!categoryId) return { error: "Обери категорію" };

  const rawDate = String(formData.get("spent_at") ?? "");
  if (!ISO_DATE.test(rawDate)) return { error: "Невірна дата" };

  const { error } = await supabase
    .from("expenses")
    .update({
      category_id: categoryId,
      amount,
      spent_at: rawDate,
      note: text(formData.get("note")),
    })
    .eq("id", id);

  if (error) return { error: "Не вдалося оновити витрату" };

  refreshAll();
  return { ok: true };
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const { supabase } = await requireProfile();

  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) return { error: "Не вдалося видалити витрату" };

  refreshAll();
  return { ok: true };
}
