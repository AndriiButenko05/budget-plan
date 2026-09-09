"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { currentMonthKey, shiftMonth } from "@/lib/dates";
import type { Category, Profile } from "@/lib/types";

type Props = {
  month: string;
  categories: Category[];
  profiles: Profile[];
};

/** Перемикач місяця + фільтри за категорією і автором. Стан живе в URL. */
export default function FilterBar({ month, categories, profiles }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const isCurrent = month === currentMonthKey();

  return (
    <div className="card space-y-3 p-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Попередній місяць"
          onClick={() => setParam("month", shiftMonth(month, -1))}
          className="rounded-lg border border-line bg-surface-2 p-2 text-muted transition-colors hover:text-text"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <input
          type="month"
          value={month}
          onChange={(e) => setParam("month", e.target.value || null)}
          aria-label="Місяць"
          className="field flex-1 text-center"
        />

        <button
          type="button"
          aria-label="Наступний місяць"
          disabled={isCurrent}
          onClick={() => setParam("month", shiftMonth(month, 1))}
          className="rounded-lg border border-line bg-surface-2 p-2 text-muted transition-colors hover:text-text disabled:opacity-40 disabled:hover:text-muted"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          aria-label="Категорія"
          className="field"
          value={searchParams.get("category") ?? ""}
          onChange={(e) => setParam("category", e.target.value || null)}
        >
          <option value="">Усі категорії</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Хто витратив"
          className="field"
          value={searchParams.get("user") ?? ""}
          onChange={(e) => setParam("user", e.target.value || null)}
        >
          <option value="">Ми обоє</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
