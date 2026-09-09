"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  axisStyle,
  dayTooltipLabel,
  gridStroke,
  moneyTooltip,
  tooltipStyle,
} from "@/components/charts/theme";
import { formatMoneyShort } from "@/lib/format";

type Point = { day: number; current: number | null; previous: number | null };

/** Наростаючі витрати по днях: цей місяць проти минулого. */
export default function CumulativeLine({ data }: { data: Point[] }) {
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={gridStroke} vertical={false} />
          <XAxis dataKey="day" {...axisStyle} />
          <YAxis tickFormatter={formatMoneyShort} width={70} {...axisStyle} />
          <Tooltip
            formatter={moneyTooltip}
            labelFormatter={dayTooltipLabel}
            {...tooltipStyle}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#9a99b2" }} />
          <Line
            type="monotone"
            dataKey="previous"
            name="Минулий місяць"
            stroke="#4c4a6a"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="current"
            name="Цей місяць"
            stroke="#a78bfa"
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
