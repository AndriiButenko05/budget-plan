"use client";

import dynamic from "next/dynamic";

/**
 * Recharts вимірює контейнер уже в браузері, тому на сервері він малює
 * порожнечу. Рендерити його на сервері — марна робота і зайвий HTML,
 * звідси ssr: false. Заодно кожен графік їде окремим чанком.
 */
function Skeleton({ height }: { height: number }) {
  return (
    <div
      className="animate-pulse rounded-xl bg-surface-2"
      style={{ height }}
      aria-hidden
    />
  );
}

export const CategoryPie = dynamic(() => import("@/components/charts/category-pie"), {
  ssr: false,
  loading: () => <Skeleton height={224} />,
});

export const MonthsBar = dynamic(() => import("@/components/charts/months-bar"), {
  ssr: false,
  loading: () => <Skeleton height={240} />,
});

export const CumulativeLine = dynamic(
  () => import("@/components/charts/cumulative-line"),
  { ssr: false, loading: () => <Skeleton height={240} /> },
);

export const OwnerCompareBar = dynamic(
  () => import("@/components/charts/owner-compare-bar"),
  { ssr: false, loading: () => <Skeleton height={200} /> },
);
