"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/** Живе внизу сторінки налаштувань — у шапці кнопку легко зачепити випадково. */
export default function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="btn w-full border border-danger/45 bg-danger/10 text-danger transition-colors hover:border-danger/70 hover:bg-danger/20"
    >
      <LogOut className="h-4 w-4" />
      Вийти
    </button>
  );
}
