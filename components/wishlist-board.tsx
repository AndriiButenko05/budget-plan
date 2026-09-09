"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import WishCard from "@/components/wish-card";
import WishDialog from "@/components/wish-dialog";
import { OWNER_LABELS } from "@/lib/labels";
import type { WishOwner, WishlistItem } from "@/lib/types";

type Props = {
  items: WishlistItem[];
  /** image_path → підписаний URL. */
  imageUrls: Record<string, string>;
};

/** Дві колонки на десктопі, таби на телефоні. */
export default function WishlistBoard({ items, imageUrls }: Props) {
  const [tab, setTab] = useState<WishOwner>("her");
  const [dialogOwner, setDialogOwner] = useState<WishOwner | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-2 md:hidden">
        {(["her", "him"] as const).map((owner) => {
          const active = tab === owner;
          const color = owner === "her" ? "var(--her)" : "var(--him)";
          return (
            <button
              key={owner}
              type="button"
              onClick={() => setTab(owner)}
              aria-pressed={active}
              className={`rounded-xl border py-2.5 text-sm transition-colors ${
                active ? "text-text" : "border-line bg-surface-2 text-muted"
              }`}
              style={
                active
                  ? {
                      borderColor: color,
                      background: `color-mix(in srgb, ${color} 20%, transparent)`,
                    }
                  : undefined
              }
            >
              {OWNER_LABELS[owner]}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-5 md:grid-cols-2">
        {(["her", "him"] as const).map((owner) => {
          const list = items.filter((item) => item.for_whom === owner);
          const color = owner === "her" ? "var(--her)" : "var(--him)";

          return (
            <section
              key={owner}
              className={tab === owner ? "block" : "hidden md:block"}
            >
              <div className="mb-3 flex items-center gap-2 px-1">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: color }}
                  aria-hidden
                />
                <h2 className="mr-auto text-sm font-semibold" style={{ color }}>
                  {OWNER_LABELS[owner]}
                </h2>
                <button
                  type="button"
                  onClick={() => setDialogOwner(owner)}
                  className="flex items-center gap-1 rounded-lg border border-line bg-surface-2 px-2 py-1 text-xs text-muted transition-colors hover:text-text"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Додати
                </button>
              </div>

              {list.length === 0 ? (
                <p className="card px-4 py-10 text-center text-sm text-muted">
                  Поки що порожньо
                </p>
              ) : (
                <div className="space-y-4">
                  {list.map((item) => (
                    <WishCard
                      key={item.id}
                      item={item}
                      imageUrl={item.image_path ? (imageUrls[item.image_path] ?? null) : null}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <WishDialog
        key={dialogOwner ?? "none"}
        open={dialogOwner !== null}
        onClose={() => setDialogOwner(null)}
        defaultOwner={dialogOwner ?? "her"}
      />
    </>
  );
}
