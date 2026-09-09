"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { type ActionResult, parseAmount, text } from "@/lib/actions/shared";
import type { WishOwner } from "@/lib/types";

const BUCKET = "wishlist";

function owner(raw: FormDataEntryValue | null): WishOwner | null {
  const value = String(raw ?? "");
  return value === "her" || value === "him" ? value : null;
}

/** Дозволяємо лише http(s) — щоб у картку не потрапив javascript: */
function safeUrl(raw: FormDataEntryValue | null) {
  const value = text(raw);
  if (!value) return null;
  try {
    const parsed = new URL(value.startsWith("http") ? value : `https://${value}`);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

export async function addWishItem(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, profile } = await requireProfile();

  const forWhom = owner(formData.get("for_whom"));
  if (!forWhom) return { error: "Обери, для кого це" };

  const title = text(formData.get("title"));
  if (!title) return { error: "Додай назву" };

  const rawPrice = String(formData.get("price") ?? "").trim();

  const { error } = await supabase.from("wishlist_items").insert({
    created_by: profile.id,
    for_whom: forWhom,
    title,
    url: safeUrl(formData.get("url")),
    note: text(formData.get("note")),
    price: rawPrice ? parseAmount(rawPrice) : null,
    image_path: text(formData.get("image_path")),
  });

  if (error) return { error: "Не вдалося зберегти" };

  revalidatePath("/wishlist");
  return { ok: true };
}

export async function toggleWishStatus(id: string): Promise<ActionResult> {
  const { supabase } = await requireProfile();

  const { data: item } = await supabase
    .from("wishlist_items")
    .select("status")
    .eq("id", id)
    .maybeSingle<{ status: "idea" | "bought" }>();

  if (!item) return { error: "Запис не знайдено" };

  const { error } = await supabase
    .from("wishlist_items")
    .update({ status: item.status === "bought" ? "idea" : "bought" })
    .eq("id", id);

  if (error) return { error: "Не вдалося оновити" };

  revalidatePath("/wishlist");
  return { ok: true };
}

export async function deleteWishItem(id: string): Promise<ActionResult> {
  const { supabase } = await requireProfile();

  const { data: item } = await supabase
    .from("wishlist_items")
    .select("image_path")
    .eq("id", id)
    .maybeSingle<{ image_path: string | null }>();

  const { error } = await supabase.from("wishlist_items").delete().eq("id", id);
  if (error) return { error: "Не вдалося видалити" };

  // Фото прибираємо тільки після успішного видалення запису.
  if (item?.image_path) {
    await supabase.storage.from(BUCKET).remove([item.image_path]);
  }

  revalidatePath("/wishlist");
  return { ok: true };
}
