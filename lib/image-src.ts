/** Стабільна адреса фото вішліста; сам маршрут перевіряє доступ. */
export function imageSrc(imagePath: string) {
  return `/api/wishlist-image/${encodeURIComponent(imagePath)}`;
}
