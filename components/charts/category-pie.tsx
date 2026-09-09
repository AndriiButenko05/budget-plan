"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { moneyTooltip, tooltipStyle } from "@/components/charts/theme";
import { formatMoney } from "@/lib/format";
import type { CategorySlice } from "@/lib/aggregate";

export default function CategoryPie({ slices }: { slices: CategorySlice[] }) {
  if (slices.length === 0) {
    return <p className="py-12 text-center text-sm text-muted">Немає даних</p>;
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-56 w-full sm:w-1/2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="total"
              nameKey="name"
              innerRadius="58%"
              outerRadius="88%"
              paddingAngle={2}
              stroke="none"
            >
              {slices.map((slice) => (
                <Cell key={slice.id} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip formatter={moneyTooltip} {...tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="w-full space-y-1.5 sm:w-1/2">
        {slices.map((slice) => (
          <li key={slice.id} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: slice.color }}
              aria-hidden
            />
            <span className="mr-auto truncate">{slice.name}</span>
            <span className="tabular-nums">{formatMoney(slice.total)}</span>
            <span className="w-10 text-right text-xs tabular-nums text-muted">
              {Math.round(slice.share * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
