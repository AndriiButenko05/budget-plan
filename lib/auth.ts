import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { BudgetCurrency, Profile } from "@/lib/types";

/**
 * Хто зробив запит, або null, якщо це не один із двох дозволених акаунтів.
 *
 * Обгорнуто в cache() навмисно: layout і сторінка викликають це в одному
 * рендері, і без кешу виходили два зайвих звернення до Supabase —
 * перевірка сесії плюс запит профілю. cache() живе один запит,
 * тож між користувачами нічого не протікає.
 */
export const getProfile = cache(async () => {
  // Явно позначаємо, що далі йде робота часу запиту. Без цього
  // supabase-js встигає глянути на годинник (перевірка строку дії токена)
  // раніше, ніж прочитає куку, і пререндер падає на blocking-prerender-current-time.
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const first = await supabase
    .from("profiles")
    .select("id,name,color,created_at,household:households(currency)")
    .eq("id", user.id)
    .maybeSingle<Profile & { household: { currency: BudgetCurrency } | null }>();
  let profile = first.data;

  // Поки migration-households.sql не запущено, таблиці households немає
  // і запит вище падає. Тоді беремо профіль без неї — валюта PLN, як було.
  if (first.error) {
    ({ data: profile } = await supabase
      .from("profiles")
      .select("id,name,color,created_at")
      .eq("id", user.id)
      .maybeSingle<Profile & { household: null }>());
  }

  if (!profile) return null;

  const { household, ...rest } = profile;
  // Валюта бюджету: у вас PLN, в окремого бюджету може бути EUR.
  const currency: BudgetCurrency = household?.currency === "EUR" ? "EUR" : "PLN";

  return { supabase, user, profile: rest as Profile, currency };
});

/** Те саме, але для сторінок: без доступу — на форму входу. */
export async function requireProfile() {
  const session = await getProfile();
  if (!session) redirect("/login");
  return session;
}
