/** Заготовки, які видно поки дані ще їдуть із сервера. */

export function CardSkeleton({ height = 120 }: { height?: number }) {
  return (
    <div
      className="animate-pulse rounded-2xl border border-line bg-surface/60"
      style={{ height }}
      aria-hidden
    />
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="card divide-y divide-line overflow-hidden" aria-hidden>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-3 py-3">
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-surface-2" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-24 animate-pulse rounded bg-surface-2" />
            <div className="h-2.5 w-32 animate-pulse rounded bg-surface-2" />
          </div>
          <div className="h-3 w-16 animate-pulse rounded bg-surface-2" />
        </div>
      ))}
    </div>
  );
}

export function ChipSkeleton() {
  return (
    <span
      className="h-6 w-20 animate-pulse rounded-full bg-surface-2"
      aria-hidden
    />
  );
}
