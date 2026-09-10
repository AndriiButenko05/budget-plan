/**
 * Правила вводу для полів із сумами.
 *
 * Раніше поле приймало будь-що, і пробіл або зайва кома тихо ламали
 * збереження — форма просто казала «вкажи суму більше нуля».
 * Простіше не дати ввести зайве, ніж потім пояснювати помилку.
 */

const MAX_LENGTH = 12;

/**
 * Лише цифри — для полів, де потрібне ціле число.
 *
 * Усе після коми чи крапки відкидаємо, а не склеюємо: інакше «12,50»
 * перетворилось би на 1250, тобто у сто разів більше за задумане.
 */
export function digitsOnly(value: string) {
  return value
    .split(/[.,]/)[0]
    .replace(/[^0-9]/g, "")
    .replace(/^0+(?=[0-9])/, "")
    .slice(0, MAX_LENGTH);
}

/** Цифри та один роздільник — для сум із копійками. */
export function decimalOnly(value: string) {
  const cleaned = value.replace(/[^0-9.,]/g, "");
  const separator = cleaned.search(/[.,]/);

  if (separator === -1) return cleaned.slice(0, MAX_LENGTH);

  const whole = cleaned.slice(0, separator + 1);
  const fraction = cleaned.slice(separator + 1).replace(/[.,]/g, "");
  return (whole + fraction).slice(0, MAX_LENGTH);
}
