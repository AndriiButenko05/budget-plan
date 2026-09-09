"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { axisStyle, gridStroke, moneyTooltip, tooltipStyle } from "@/components/charts/theme";
import { formatMoneyShort } from "@/lib/format";


type Series = { id: string; name: string; color: string };

type Props = {
  data: Record<string, string | number>[];
  series: Series[];
};

/** Хто скільки витратив у кожній категорії. */
export default function OwnerCompareBar({ data, series }: Props) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-muted">Немає даних</p>;
  }

  return (
    <div className="w-full" style={{ height: Math.max(data.length * 42 + 48, 200) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 12, bottom: 0, left: 4 }}
        >
          <CartesianGrid stroke={gridStroke} horizontal={false} />
          <XAxis type="number" tickFormatter={formatMoneyShort} {...axisStyle} />
          <YAxis type="category" dataKey="name" width={92} {...axisStyle} />
          <Tooltip
            formatter={moneyTooltip}
            cursor={{ fill: "#ffffff0a" }}
            {...tooltipStyle}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#9a99b2" }} />
          {series.map((entry) => (
            <Bar
              key={entry.id}
              dataKey={entry.id}
              name={entry.name}
              fill={entry.color}
              radius={[0, 4, 4, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
