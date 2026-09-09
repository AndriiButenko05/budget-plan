-- ============================================================
--  Валюта для позицій вішліста: PLN або UAH.
--  Запустити один раз у SQL Editor.
--  Усі наявні записи залишаються в PLN.
-- ============================================================

alter table public.wishlist_items
  add column if not exists currency text not null default 'PLN'
  check (currency in ('PLN', 'UAH'));

select title, price, currency from public.wishlist_items order by created_at desc;
