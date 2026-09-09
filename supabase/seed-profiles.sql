-- ============================================================
--  Крок 2: після створення двох користувачів у Authentication → Users
--  впиши їхні email нижче та запусти цей файл.
--  Рядок у profiles = дозвіл на доступ до сайту.
-- ============================================================

insert into public.profiles (id, name, color)
select id, 'Andrii', '#38bdf8' from auth.users where email = 'ЗАМІНИ-НА-ТВІЙ@email.com'
on conflict (id) do update set name = excluded.name, color = excluded.color;

insert into public.profiles (id, name, color)
select id, 'Ім''я дівчини', '#f472b6' from auth.users where email = 'ЗАМІНИ-НА-ЇЇ@email.com'
on conflict (id) do update set name = excluded.name, color = excluded.color;

-- Перевірка: має бути рівно 2 рядки
select p.name, p.color, u.email from public.profiles p join auth.users u on u.id = p.id;
