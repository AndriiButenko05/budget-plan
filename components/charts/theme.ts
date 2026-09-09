import { formatMoney, formatMonthYear } from "@/lib/format";

/** Спільні стилі для всіх графіків, щоб вони виглядали як одна система. */
export const axisStyle = {
  stroke: "#3a3a4e",
  tick: { fill: "#9a99b2", fontSize: 11 },
} as const;

export const gridStroke = "#242433";

export const tooltipStyle = {
  contentStyle: {
    background: "#1d1d2b",
    border: "1px solid #313145",
    borderRadius: 12,
    fontSize: 12,
    color: "#f2f1f8",
  },
  labelStyle: { color: "#9a99b2", marginBottom: 4 },
  itemStyle: { color: "#f2f1f8" },
} as const;

/**
 * Recharts типізує аргументи форматерів як ReactNode | undefined,
 * тому приймаємо unknown і зводимо самі.
 */
export const moneyTooltip = (value: unknown) => formatMoney(Number(value));
export const monthTooltipLabel = (label: unknown) => formatMonthYear(`${String(label)}-01`);
export const dayTooltipLabel = (label: unknown) => `${String(label)} день`;
