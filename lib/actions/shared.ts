export type ActionResult = { ok?: boolean; error?: string };

export const idle: ActionResult = {};

/** Приймає і «12.50», і «12,50». Повертає null, якщо це не додатна сума. */
export function parseAmount(raw: FormDataEntryValue | null) {
  const value = Number(String(raw ?? "").replace(",", ".").trim());
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100) / 100;
}

/** Порожній рядок → null, щоб не писати в базу пусті нотатки. */
export function text(raw: FormDataEntryValue | null) {
  const value = String(raw ?? "").trim();
  return value.length > 0 ? value : null;
}
