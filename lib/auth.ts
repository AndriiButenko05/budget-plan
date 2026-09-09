import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Гарантує, що запит зробив один із двох дозволених користувачів.
 *
 * Обгорнуто в cache() навмисно: layout і сторінка викликають це в одному
 * рендері, і без кешу виходили два зайвих звернення до Supabase —
 * перевірка сесії плюс запит профілю. cache() живе один запит,
 * тож між користувачами нічого не протікає.
 */
export const requireProfile = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,name,color,created_at")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  if (!profile) redirect("/login");

  return { supabase, user, profile };
});
