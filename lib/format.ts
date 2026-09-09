import type { Currency } from "@/lib/types";

/**
 * Символ валюти задаємо самі, а не через style: "currency".
 * Node та Chrome мають різні версії ICU: для UAH перший дає «₴»,
 * другий — «грн», і React падав з Hydration failed на кожній ціні.
 */
const CURRENCY_SUFFIX: Record<Currency, string> = {
  PLN: "PLN",
  UAH: "₴",
};

const decimal = new Intl.NumberFormat("uk-UA", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const whole = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 });

/** 1234.5 → «1 234,50 PLN» */
export function formatMoney(value: number) {
  return `${decimal.format(value)} ${CURRENCY_SUFFIX.PLN}`;
}

/** Для осей графіків: 1234.5 → «1 235 PLN» */
export function formatMoneyShort(value: number) {
  return `${whole.format(value)} ${CURRENCY_SUFFIX.PLN}`;
}

/** Те саме у валюті конкретної позиції вішліста. Невідома → PLN. */
export function formatMoneyIn(value: number, currency: Currency) {
  return `${decimal.format(value)} ${CURRENCY_SUFFIX[currency] ?? CURRENCY_SUFFIX.PLN}`;
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
