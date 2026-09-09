import { formatMoney } from "@/lib/format";
import type { CategorySlice } from "@/lib/aggregate";

type Props = {
  slices: CategorySlice[];
  /** category_id → ліміт на місяць. Якщо є — показуємо перевитрату. */
  limits?: Map<string, number>;
};

export default function CategoryBars({ slices, limits }: Props) {
  if (slices.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">Ще немає витрат</p>;
  }

  return (
    <ul className="space-y-3">
      {slices.map((slice) => {
        const limit = limits?.get(slice.id);
        const over = limit !== undefined && slice.total > limit;
        const fill = limit !== undefined ? Math.min(slice.total / limit, 1) : slice.share;

        return (
          <li key={slice.id}>
            <div className="mb-1.5 flex items-baseline gap-2 text-sm">
              <span aria-hidden>{slice.icon}</span>
              <span className="mr-auto truncate">{slice.name}</span>
              <span className="font-semibold tabular-nums">{formatMoney(slice.total)}</span>
              <span
                className={`w-24 text-right text-xs tabular-nums ${
                  over ? "text-danger" : "text-muted"
                }`}
              >
                {limit !== undefined
                  ? `з ${formatMoney(limit)}`
                  : `${Math.round(slice.share * 100)}%`}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${Math.max(fill * 100, 2)}%`,
                  background: over ? "var(--danger)" : slice.color,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
