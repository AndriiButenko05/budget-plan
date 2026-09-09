/** Найдовша сторона після стискання — вистачає для карточки й для перегляду. */
const MAX_SIDE = 1400;
const WEBP_QUALITY = 0.82;
/** Дрібні файли не чіпаємо — перекодування лише зіпсує якість. */
const SKIP_BELOW_BYTES = 300 * 1024;

/**
 * Стискає фото прямо в браузері: фото з телефона важить 3-5 МБ, а в
 * карточці показується смужкою 160px висотою. Після стискання виходить
 * ~100-200 КБ, тобто і завантаження, і відкриття сторінки в разів швидші.
 *
 * Якщо браузер не вміє прочитати формат (наприклад HEIC зі старого iOS),
 * повертаємо оригінал — бакет такі типи приймає.
 */
export async function downscaleImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size < SKIP_BELOW_BYTES) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
    );

    // Буває, що стиснене більше за оригінал — тоді оригінал і лишаємо.
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], "photo.webp", { type: "image/webp" });
  } catch {
    return file;
  }
}
