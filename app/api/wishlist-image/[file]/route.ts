import { getProfile } from "@/lib/auth";

/** Той самий формат, який генерує форма вішліста: «uuid.розширення». */
const FILE = /^[0-9a-f-]{36}\.[a-z0-9]{2,5}$/i;

const BUCKET = "wishlist";
const YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Віддає фото вішліста з приватного бакета під нашим власним стабільним
 * посиланням.
 *
 * Раніше сторінка щоразу генерувала підписані посилання Supabase, а вони
 * містять свіжий токен на кожен рендер. Через це адреса змінювалась при
 * кожному відкритті сторінки, і браузер щоразу качав фото заново.
 * Тут адреса залежить лише від імені файлу, а вміст за цим іменем ніколи
 * не змінюється — тож кешуємо назавжди й економимо одне звернення до
 * Supabase на кожне відкриття вішліста.
 *
 * Кеш саме private: посилання наше, але доступ так само лише для двох.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/api/wishlist-image/[file]">,
) {
  const { file } = await context.params;
  if (!FILE.test(file)) return new Response(null, { status: 404 });

  const session = await getProfile();
  if (!session) return new Response(null, { status: 401 });

  const { data, error } = await session.supabase.storage.from(BUCKET).download(file);
  if (error || !data) return new Response(null, { status: 404 });

  return new Response(data, {
    headers: {
      "Content-Type": data.type || "application/octet-stream",
      "Cache-Control": `private, max-age=${YEAR_SECONDS}, immutable`,
    },
  });
}
