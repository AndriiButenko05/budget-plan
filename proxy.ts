import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export default async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // api/wishlist-image перевіряє доступ сам, тож друга перевірка сесії
  // на кожен запит фото була б марною тратою round-trip до Supabase.
  matcher: [
    "/((?!_next/static|_next/image|api/wishlist-image|favicon.ico|manifest.webmanifest|icons/|.*\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)",
  ],
};
