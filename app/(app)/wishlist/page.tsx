import { Suspense } from "react";
import WishlistBoard from "@/components/wishlist-board";
import WishlistTotals from "@/components/wishlist-totals";
import { CardSkeleton } from "@/components/skeletons";
import { requireProfile } from "@/lib/auth";
import { getWishlist } from "@/lib/queries";

export const metadata = { title: "Вішліст — Наш бюджет" };

export default function WishlistPage() {
  return (
    <div className="space-y-4">
      <div className="px-1">
        <h1 className="text-lg font-semibold">Вішліст</h1>
        <p className="mt-0.5 text-xs text-muted">
          Фото, посилання або просто ідея — щоб не забути
        </p>
      </div>

      <Suspense fallback={<WishlistSkeleton />}>
        <WishlistContent />
      </Suspense>
    </div>
  );
}

async function WishlistContent() {
  const { supabase } = await requireProfile();
  const items = await getWishlist(supabase);

  return (
    <>
      <WishlistTotals items={items} />
      <WishlistBoard items={items} />
    </>
  );
}

function WishlistSkeleton() {
  return (
    <div className="space-y-4">
      <CardSkeleton height={92} />
      <div className="grid gap-5 md:grid-cols-2">
        <CardSkeleton height={220} />
        <CardSkeleton height={220} />
      </div>
    </div>
  );
}
