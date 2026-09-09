import WishlistBoard from "@/components/wishlist-board";
import WishlistTotals from "@/components/wishlist-totals";
import { requireProfile } from "@/lib/auth";
import { getWishlist } from "@/lib/queries";

export const metadata = { title: "Вішліст — Наш бюджет" };

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export default async function WishlistPage() {
  const { supabase } = await requireProfile();
  const items = await getWishlist(supabase);

  // Бакет приватний, тож для кожного фото робимо тимчасове посилання.
  const paths = items.map((item) => item.image_path).filter((p): p is string => Boolean(p));
  const imageUrls: Record<string, string> = {};

  if (paths.length > 0) {
    const { data } = await supabase.storage
      .from("wishlist")
      .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

    for (const entry of data ?? []) {
      if (entry.path && entry.signedUrl) imageUrls[entry.path] = entry.signedUrl;
    }
  }

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h1 className="text-lg font-semibold">Вішліст</h1>
        <p className="mt-0.5 text-xs text-muted">
          Фото, посилання або просто ідея — щоб не забути
        </p>
      </div>

      <WishlistTotals items={items} />

      <WishlistBoard items={items} imageUrls={imageUrls} />
    </div>
  );
}
