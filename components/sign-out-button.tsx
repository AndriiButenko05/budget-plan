"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
      aria-label="Вийти"
      title="Вийти"
      className="rounded-xl border border-line bg-surface-2 p-2 text-muted transition-colors hover:text-danger"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
