import { totalsByCurrency } from "@/lib/aggregate";
import { formatMoneyIn } from "@/lib/format";
import type { WishlistItem } from "@/lib/types";

/**
 * Скільки ще треба на вішліст. Куплені позиції не рахуються —
 * інакше число показувало б не потребу, а суму всього колись бажаного.
 */
export default function WishlistTotals({ items }: { items: WishlistItem[] }) {
  const pending = items.filter((item) => item.status === "idea");

  const columns = [
    {
      label: "Для неї",
      color: "var(--her)",
      totals: totalsByCurrency(pending.filter((i) => i.for_whom === "her")),
    },
    {
      label: "Для нього",
      color: "var(--him)",
      totals: totalsByCurrency(pending.filter((i) => i.for_whom === "him")),
    },
    {
      label: "Разом",
      color: "var(--accent)",
      totals: totalsByCurrency(pending),
    },
  ];

  return (
    <section className="card p-4">
      <p className="mb-3 text-xs uppercase tracking-wide text-muted">
        Очікується
      </p>
      <div className="grid grid-cols-3 gap-3">
        {columns.map(({ label, color, totals }) => (
          <div key={label} className="min-w-0">
            <p className="mb-1 flex items-center gap-1.5 text-xs" style={{ color }}>
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
              <span className="truncate">{label}</span>
            </p>
            {totals.length === 0 ? (
              <p className="text-sm text-muted">—</p>
            ) : (
              totals.map(([currency, sum]) => (
                <p
                  key={currency}
                  className="text-xs font-semibold tabular-nums leading-snug sm:text-sm"
                >
                  {formatMoneyIn(sum, currency)}
                </p>
              ))
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
