export type ActionResult = { ok?: boolean; error?: string };

export const idle: ActionResult = {};

/**
 * Приймає і «12.50», і «12,50», і «1 234,50 zł».
 * Лишаємо тільки цифри та роздільник: так відпадають будь-які пробіли,
 * зокрема нерозривні, які підставляє форматування й вставка з буфера.
 */
export function parseAmount(raw: FormDataEntryValue | null) {
  const source = String(raw ?? "");

  // Мінус — це не сміття форматування, а інший намір. Якщо просто
  // вирізати його разом із рештою, «-5» тихо стало б п'ятіркою.
  if (source.includes("-")) return null;

  const cleaned = source
    .replace(/[^0-9.,]/g, "")
    .replace(",", ".");

  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100) / 100;
}

/**
 * Порожній рядок → null, щоб не писати в базу пусті нотатки.
 * maxLength обрізає надто довгий ввід — інакше в базу можна залити
 * рядок будь-якого розміру.
 */
export function text(raw: FormDataEntryValue | null, maxLength = 500) {
  const value = String(raw ?? "").trim().slice(0, maxLength);
  return value.length > 0 ? value : null;
}
