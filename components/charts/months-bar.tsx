"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  axisStyle,
  gridStroke,
  monthTooltipLabel,
  moneyTooltip,
  tooltipStyle,
} from "@/components/charts/theme";
import { formatMoneyShort, formatShortMonth } from "@/lib/format";

type Point = { month: string; total: number };

export default function MonthsBar({
  data,
  highlight,
}: {
  data: Point[];
  /** «YYYY-MM» поточного місяця — підсвічуємо його стовпчик. */
  highlight: string;
}) {
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={gridStroke} vertical={false} />
          <XAxis
            dataKey="month"
            tickFormatter={(month: string) => formatShortMonth(`${month}-01`)}
            {...axisStyle}
          />
          <YAxis tickFormatter={formatMoneyShort} width={70} {...axisStyle} />
          <Tooltip
            formatter={moneyTooltip}
            labelFormatter={monthTooltipLabel}
            cursor={{ fill: "#ffffff0a" }}
            {...tooltipStyle}
          />
          <Bar dataKey="total" name="Витрати" radius={[6, 6, 0, 0]}>
            {data.map((point) => (
              <Cell
                key={point.month}
                fill={point.month === highlight ? "#a78bfa" : "#4c4a6a"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
