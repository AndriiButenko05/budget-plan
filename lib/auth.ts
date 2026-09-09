import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Хто зробив запит, або null, якщо це не один із двох дозволених акаунтів.
 *
 * Обгорнуто в cache() навмисно: layout і сторінка викликають це в одному
 * рендері, і без кешу виходили два зайвих звернення до Supabase —
 * перевірка сесії плюс запит профілю. cache() живе один запит,
 * тож між користувачами нічого не протікає.
 */
export const getProfile = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,name,color,created_at")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  return profile ? { supabase, user, profile } : null;
});

/** Те саме, але для сторінок: без доступу — на форму входу. */
export async function requireProfile() {
  const session = await getProfile();
  if (!session) redirect("/login");
  return session;
}
