"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, RotateCcw, Trash2 } from "lucide-react";
import { deleteWishItem, toggleWishStatus } from "@/lib/actions/wishlist";
import { formatMoney } from "@/lib/format";
import type { WishlistItem } from "@/lib/types";

type Props = {
  item: WishlistItem;
  /** Підписане посилання на фото — живе годину, генерується на сервері. */
  imageUrl: string | null;
};

export default function WishCard({ item, imageUrl }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const bought = item.status === "bought";

  function toggle() {
    startTransition(async () => {
      await toggleWishStatus(item.id);
      router.refresh();
    });
  }

  function remove() {
    if (!confirm(`Видалити «${item.title}» з вішліста?`)) return;
    startTransition(async () => {
      await deleteWishItem(item.id);
      router.refresh();
    });
  }

  return (
    <article
      className={`card overflow-hidden transition-opacity ${
        pending ? "opacity-50" : ""
      } ${bought ? "opacity-60" : ""}`}
    >
      {imageUrl && (
        // Підписані URL з Supabase — обходимося без next/image
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={item.title}
          className="h-40 w-full object-cover"
          loading="lazy"
        />
      )}

      <div className="space-y-2 p-4">
        <div className="flex items-start gap-2">
          <h3
            className={`mr-auto text-sm font-semibold leading-snug ${
              bought ? "line-through decoration-muted" : ""
            }`}
          >
            {item.title}
          </h3>
          {item.price !== null && (
            <span className="shrink-0 text-sm font-semibold tabular-nums text-accent">
              {formatMoney(item.price)}
            </span>
          )}
        </div>

        {item.note && <p className="text-xs leading-relaxed text-muted">{item.note}</p>}

        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 truncate text-xs text-him hover:underline"
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            {hostOf(item.url)}
          </a>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={toggle}
            disabled={pending}
            className="btn btn-ghost flex-1 py-1.5 text-xs"
          >
            {bought ? (
              <>
                <RotateCcw className="h-3.5 w-3.5" />
                Повернути
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                Куплено
              </>
            )}
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label="Видалити"
            className="rounded-lg border border-line bg-surface-2 p-2 text-muted transition-colors hover:text-danger"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
