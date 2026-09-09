"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { type ActionResult, parseAmount, text } from "@/lib/actions/shared";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function refreshAll() {
  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/charts");
  revalidatePath("/settings");
}

export async function saveCategory(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase } = await requireProfile();

  const name = text(formData.get("name"));
  if (!name) return { error: "Назва не може бути порожньою" };

  const rawColor = String(formData.get("color") ?? "");
  const color = HEX_COLOR.test(rawColor) ? rawColor : "#94a3b8";
  const icon = text(formData.get("icon"))?.slice(0, 4) ?? "📦";
  const id = text(formData.get("id"));

  const { error } = id
    ? await supabase.from("categories").update({ name, icon, color }).eq("id", id)
    : await supabase.from("categories").insert({ name, icon, color, sort_order: 100 });

  if (error) return { error: "Не вдалося зберегти категорію" };

  refreshAll();
  return { ok: true };
}

/**
 * Категорії не видаляємо, а архівуємо — інакше зламалася б історія витрат,
 * які на неї посилаються.
 */
export async function setCategoryArchived(
  id: string,
  archived: boolean,
): Promise<ActionResult> {
  const { supabase } = await requireProfile();

  const { error } = await supabase
    .from("categories")
    .update({ is_archived: archived })
    .eq("id", id);

  if (error) return { error: "Не вдалося змінити категорію" };

  refreshAll();
  return { ok: true };
}

/** Ліміт 0 або порожній — прибираємо ліміт зовсім. */
export async function setBudget(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase } = await requireProfile();

  const categoryId = String(formData.get("category_id") ?? "");
  const monthKey = String(formData.get("month") ?? "");
  if (!categoryId || !/^\d{4}-\d{2}$/.test(monthKey)) {
    return { error: "Невірні дані" };
  }

  const month = `${monthKey}-01`;
  const raw = String(formData.get("limit_amount") ?? "").trim();
  const amount = raw ? parseAmount(raw) : null;

  if (raw && amount === null) return { error: "Ліміт має бути числом більше нуля" };

  const { error } = amount
    ? await supabase
        .from("budgets")
        .upsert({ category_id: categoryId, month, limit_amount: amount }, {
          onConflict: "category_id,month",
        })
    : await supabase
        .from("budgets")
        .delete()
        .eq("category_id", categoryId)
        .eq("month", month);

  if (error) return { error: "Не вдалося зберегти ліміт" };

  refreshAll();
  return { ok: true };
}

export async function updateProfile(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, profile } = await requireProfile();

  const name = text(formData.get("name"));
  if (!name) return { error: "Введи імʼя" };

  const rawColor = String(formData.get("color") ?? "");
  const color = HEX_COLOR.test(rawColor) ? rawColor : profile.color;

  const { error } = await supabase
    .from("profiles")
    .update({ name, color })
    .eq("id", profile.id);

  if (error) return { error: "Не вдалося зберегти профіль" };

  refreshAll();
  return { ok: true };
}
