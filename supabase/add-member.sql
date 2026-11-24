-- ============================================================
--  Дати людині доступ до сайту.
--  Запускати ПІСЛЯ migration-households.sql.
--
--  1. Authentication → Users → Add user → Create new user:
--     email + пароль, галочка Auto Confirm User.
--  2. Нижче впиши її email (і за потреби решту) та запусти.
--
--  За замовчуванням людина отримує ОКРЕМИЙ бюджет: бачить тільки
--  своє, а ви — тільки своє.
--  Щоб натомість додати її в чийсь наявний бюджет (наприклад, її
--  партнера), впиши його email у join_email.
-- ============================================================

do $$
declare
  member_email text := 'хтось@example.com';  -- ← пошта нової людини
  budget_name  text := 'Мій бюджет';          -- назва її бюджету
  budget_cur   text := 'EUR';                 -- 'EUR' або 'PLN'
  join_email   text := null;                  -- або пошта того, до чийого бюджету додати

  uid uuid;
  h   uuid;
begin
  select id into uid from auth.users where lower(email) = lower(trim(member_email));
  if uid is null then
    raise exception 'Користувача % немає в Authentication → Users — спершу створи його', member_email;
  end if;

  if exists (select 1 from public.profiles where id = uid) then
    raise exception 'У % доступ уже є', member_email;
  end if;

  if join_email is not null then
    select p.household_id into h
    from public.profiles p
    join auth.users u on u.id = p.id
    where lower(u.email) = lower(trim(join_email));

    if h is null then
      raise exception 'У % немає бюджету, до якого можна додати', join_email;
    end if;
  else
    insert into public.households (name, currency)
    values (budget_name, budget_cur)
    returning id into h;

    perform public.seed_default_categories(h);
  end if;

  insert into public.profiles (id, name, color, household_id)
  values (uid, split_part(member_email, '@', 1), '#38bdf8', h);
end $$;

-- Перевірка: хто в якому бюджеті
select h.name as бюджет, h.currency as валюта, u.email, p.name as імʼя
from public.profiles p
join public.households h on h.id = p.household_id
join auth.users u on u.id = p.id
order by h.created_at, p.created_at;
