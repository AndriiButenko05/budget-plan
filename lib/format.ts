import type { Currency } from "@/lib/types";

const money = new Intl.NumberFormat("uk-UA", {
  style: "currency",
  currency: "PLN",
  maximumFractionDigits: 2,
});

const moneyShort = new Intl.NumberFormat("uk-UA", {
  style: "currency",
  currency: "PLN",
  maximumFractionDigits: 0,
});

/** 1234.5 → «1 234,50 PLN» */
export function formatMoney(value: number) {
  return money.format(value);
}

const byCurrency: Record<Currency, Intl.NumberFormat> = {
  PLN: money,
  UAH: new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 2,
  }),
};

/**
 * Те саме, але у валюті, вказаній для конкретної позиції вішліста.
 * Невідома валюта (наприклад, старий запис без цього поля) → PLN.
 */
export function formatMoneyIn(value: number, currency: Currency) {
  return (byCurrency[currency] ?? money).format(value);
}

/** Для осей графіків: 1234.5 → «1 235 zł» */
export function formatMoneyShort(value: number) {
  return moneyShort.format(value);
}

const dayMonth = new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "long" });
const monthYear = new Intl.DateTimeFormat("uk-UA", { month: "long", year: "numeric" });
const shortMonth = new Intl.DateTimeFormat("uk-UA", { month: "short" });

/** «2026-09-09» → «9 вересня» */
export function formatDayMonth(iso: string) {
  return dayMonth.format(parseISODate(iso));
}

/** «2026-09-01» → «вересень 2026» */
export function formatMonthYear(iso: string) {
  return monthYear.format(parseISODate(iso));
}

/** «2026-09-01» → «вер.» */
export function formatShortMonth(iso: string) {
  return shortMonth.format(parseISODate(iso));
}

/** Парсить YYYY-MM-DD як локальну дату (без зсуву часових зон). */
export function parseISODate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
