-- ============================================================
--  Крок 2: видати доступ створеним користувачам.
--  Запускати ПІСЛЯ schema.sql і ПІСЛЯ створення юзерів
--  у Authentication → Users.
--
--  Замінювати нічого не треба — запит сам візьме всіх, кого ти
--  створив, і зробить їм профілі. Імена та кольори потім легко
--  змінити на сайті: Налаштування → Мій профіль.
-- ============================================================

insert into public.profiles (id, name, color)
select
  u.id,
  split_part(u.email, '@', 1),  -- імʼя з email, потім переназвеш
  '#a78bfa'
from auth.users u
on conflict (id) do nothing;

-- Перевірка: має бути рівно два рядки — ти і вона.
select u.email, p.name, p.color
from public.profiles p
join auth.users u on u.id = p.id
order by p.created_at;
