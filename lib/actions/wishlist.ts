"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { type ActionResult, parseAmount, text } from "@/lib/actions/shared";
import type { Currency, WishOwner } from "@/lib/types";

const BUCKET = "wishlist";

function currency(raw: FormDataEntryValue | null): Currency {
  return String(raw ?? "") === "UAH" ? "UAH" : "PLN";
}

function owner(raw: FormDataEntryValue | null): WishOwner | null {
  const value = String(raw ?? "");
  return value === "her" || value === "him" ? value : null;
}

/**
 * Шлях до фото приходить з браузера, тому приймаємо тільки те, що сам
 * і згенерував: «uuid.розширення». Інакше в запис можна було б підставити
 * будь-який інший обʼєкт бакета.
 */
function safeImagePath(raw: FormDataEntryValue | null) {
  const value = text(raw, 80);
  return value && /^[0-9a-f-]{36}\.[a-z0-9]{2,5}$/i.test(value) ? value : null;
}

/** Формат «50% 30%»; будь-що інше — центр. */
function imagePosition(raw: FormDataEntryValue | null) {
  const value = String(raw ?? "").trim();
  return /^\d{1,3}% \d{1,3}%$/.test(value) ? value : "50% 50%";
}

/** Дозволяємо лише http(s) — щоб у картку не потрапив javascript: */
function safeUrl(raw: FormDataEntryValue | null) {
  const value = text(raw, 600);
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

  const title = text(formData.get("title"), 200);
  if (!title) return { error: "Додай назву" };

  const rawPrice = String(formData.get("price") ?? "").trim();

  const { error } = await supabase.from("wishlist_items").insert({
    created_by: profile.id,
    for_whom: forWhom,
    title,
    url: safeUrl(formData.get("url")),
    note: text(formData.get("note"), 1000),
    price: rawPrice ? parseAmount(rawPrice) : null,
    currency: currency(formData.get("currency")),
    image_path: safeImagePath(formData.get("image_path")),
    image_position: imagePosition(formData.get("image_position")),
  });

  if (error) return { error: "Не вдалося зберегти" };

  revalidatePath("/wishlist");
  return { ok: true };
}

export async function updateWishItem(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase } = await requireProfile();

  const id = text(formData.get("id"), 40);
  if (!id) return { error: "Запис не знайдено" };

  const forWhom = owner(formData.get("for_whom"));
  if (!forWhom) return { error: "Обери, для кого це" };

  const title = text(formData.get("title"), 200);
  if (!title) return { error: "Додай назву" };

  // Старий шлях беремо з бази, а не з форми — так браузер не може
  // попросити видалити чуже фото.
  const { data: existing } = await supabase
    .from("wishlist_items")
    .select("image_path")
    .eq("id", id)
    .maybeSingle<{ image_path: string | null }>();

  if (!existing) return { error: "Запис не знайдено" };

  const imagePath = safeImagePath(formData.get("image_path"));
  const rawPrice = String(formData.get("price") ?? "").trim();

  const { error } = await supabase
    .from("wishlist_items")
    .update({
      for_whom: forWhom,
      title,
      url: safeUrl(formData.get("url")),
      note: text(formData.get("note"), 1000),
      price: rawPrice ? parseAmount(rawPrice) : null,
      currency: currency(formData.get("currency")),
      image_path: imagePath,
      image_position: imagePosition(formData.get("image_position")),
    })
    .eq("id", id);

  if (error) return { error: "Не вдалося зберегти" };

  // Старе фото прибираємо лише після успішного оновлення запису.
  if (existing.image_path && existing.image_path !== imagePath) {
    await supabase.storage.from(BUCKET).remove([existing.image_path]);
  }

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
