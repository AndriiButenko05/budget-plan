-- ============================================================
--  Обмеження на бакет із фото вішліста.
--  Запустити один раз у SQL Editor, якщо schema.sql виконувався
--  до появи цих обмежень.
--
--  Без них сервер приймає файл будь-якого розміру й типу —
--  перевірка в браузері обходиться легко.
-- ============================================================

update storage.buckets
set public = false,
    file_size_limit = 5242880,  -- 5 МБ
    allowed_mime_types = array[
      'image/jpeg', 'image/png', 'image/webp',
      'image/gif', 'image/heic', 'image/heif'
    ]
where id = 'wishlist';

select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'wishlist';
