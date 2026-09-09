/** Дата → «YYYY-MM-DD» у локальному часі. */
export function toISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** «YYYY-MM» поточного місяця. */
export function currentMonthKey() {
  return toISODate(new Date()).slice(0, 7);
}

/** Валідує «YYYY-MM», інакше повертає поточний місяць. */
export function normalizeMonthKey(value: string | undefined | null) {
  return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : currentMonthKey();
}

/** «YYYY-MM» → межі місяця включно: [перший день, останній день]. */
export function monthRange(monthKey: string): [string, string] {
  const [y, m] = monthKey.split("-").map(Number);
  return [toISODate(new Date(y, m - 1, 1)), toISODate(new Date(y, m, 0))];
}

/** Зсуває «YYYY-MM» на delta місяців. */
export function shiftMonth(monthKey: string, delta: number) {
  const [y, m] = monthKey.split("-").map(Number);
  return toISODate(new Date(y, m - 1 + delta, 1)).slice(0, 7);
}

/** Останні n місяців включно з поточним, від найстарішого. */
export function lastMonths(monthKey: string, n: number) {
  return Array.from({ length: n }, (_, i) => shiftMonth(monthKey, i - (n - 1)));
}

/** Кількість днів у місяці «YYYY-MM». */
export function daysInMonth(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}
