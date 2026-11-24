-- ============================================================
--  Окремі бюджети (households).
--  Запустити один раз у SQL Editor, цілком.
--
--  Ви двоє стаєте одним спільним бюджетом у PLN — для вас нічого
--  не змінюється, усі витрати, категорії, ліміти, вішліст і фото
--  лишаються як були.
--
--  Після цього можна додавати інших людей з окремим бюджетом
--  (add-member.sql): вони бачать лише своє, ви — лише своє.
--  Розділення робить сама база, а не сайт.
-- ============================================================

begin;

-- ---------- Бюджети ----------
create table if not exists public.households (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  -- валюта витрат і лімітів цього бюджету
  currency   text not null default 'PLN' check (currency in ('PLN', 'EUR')),
  created_at timestamptz not null default now()
);
alter table public.households enable row level security;

alter table public.profiles
  add column if not exists household_id uuid references public.households(id) on delete restrict;

-- Бюджет поточного користувача; NULL — доступу немає.
create or replace function public.my_household()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select household_id from public.profiles where id = auth.uid();
$$;

-- Стара назва лишається: «член» = має бюджет.
create or replace function public.is_member()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.my_household() is not null;
$$;

-- ---------- household_id у всіх таблицях ----------
-- За замовчуванням — бюджет того, хто вставляє запис,
-- тож сайту не треба передавати його самому.
alter table public.categories
  add column if not exists household_id uuid references public.households(id) on delete cascade
  default public.my_household();
alter table public.expenses
  add column if not exists household_id uuid references public.households(id) on delete cascade
  default public.my_household();
alter table public.budgets
  add column if not exists household_id uuid references public.households(id) on delete cascade
  default public.my_household();
alter table public.wishlist_items
  add column if not exists household_id uuid references public.households(id) on delete cascade
  default public.my_household();

-- ---------- Наявні дані → ваш спільний бюджет ----------
do $$
declare
  h uuid;
begin
  select id into h from public.households order by created_at limit 1;
  if h is null then
    insert into public.households (name, currency) values ('Наш бюджет', 'PLN') returning id into h;
  end if;

  update public.profiles       set household_id = h where household_id is null;
  update public.categories     set household_id = h where household_id is null;
  update public.expenses       set household_id = h where household_id is null;
  update public.budgets        set household_id = h where household_id is null;
  update public.wishlist_items set household_id = h where household_id is null;
end $$;

alter table public.profiles       alter column household_id set not null;
alter table public.categories     alter column household_id set not null;
alter table public.expenses       alter column household_id set not null;
alter table public.budgets        alter column household_id set not null;
alter table public.wishlist_items alter column household_id set not null;

create index if not exists profiles_household_idx   on public.profiles (household_id);
create index if not exists categories_household_idx on public.categories (household_id);
create index if not exists expenses_household_idx   on public.expenses (household_id, spent_at desc);
create index if not exists budgets_household_idx    on public.budgets (household_id, month);
create index if not exists wishlist_household_idx   on public.wishlist_items (household_id);

-- ---------- Вішліст: ще й євро ----------
alter table public.wishlist_items drop constraint if exists wishlist_items_currency_check;
alter table public.wishlist_items
  add constraint wishlist_items_currency_check check (currency in ('PLN', 'EUR', 'UAH'));

-- ---------- Свій профіль: лише імʼя та колір ----------
-- Інакше можна було б переписати собі household_id і зайти в чужий бюджет.
revoke update on public.profiles from anon, authenticated;
grant update (name, color) on public.profiles to authenticated;

-- ---------- Категорії за замовчуванням для нового бюджету ----------
create or replace function public.seed_default_categories(h uuid)
returns void
language sql
as $$
  insert into public.categories (household_id, name, icon, color, sort_order) values
    (h, 'Їжа',        '🍔', '#f97316', 10),
    (h, 'Житло',      '🏠', '#0ea5e9', 20),
    (h, 'Транспорт',  '🚌', '#22c55e', 30),
    (h, 'Розваги',    '🎬', '#a855f7', 40),
    (h, 'Здоров''я',  '💊', '#ef4444', 50),
    (h, 'Одяг',       '👕', '#ec4899', 60),
    (h, 'Подарунки',  '🎁', '#eab308', 70),
    (h, 'Інше',       '📦', '#94a3b8', 80);
$$;
-- Функції в public доступні через API — ця лише для SQL Editor.
revoke execute on function public.seed_default_categories(uuid) from public, anon, authenticated;

-- ============================================================
--  RLS: усе — лише в межах свого бюджету
-- ============================================================

drop policy if exists households_select on public.households;
create policy households_select on public.households
  for select using (id = (select public.my_household()));

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (household_id = (select public.my_household()));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists categories_all on public.categories;
create policy categories_all on public.categories
  for all
  using (household_id = (select public.my_household()))
  with check (household_id = (select public.my_household()));

drop policy if exists budgets_all on public.budgets;
create policy budgets_all on public.budgets
  for all
  using (household_id = (select public.my_household()))
  with check (
    household_id = (select public.my_household())
    and exists (
      select 1 from public.categories c
      where c.id = category_id and c.household_id = (select public.my_household())
    )
  );

drop policy if exists wishlist_all on public.wishlist_items;
create policy wishlist_all on public.wishlist_items
  for all
  using (household_id = (select public.my_household()))
  with check (
    household_id = (select public.my_household())
    and exists (
      select 1 from public.profiles p
      where p.id = created_by and p.household_id = (select public.my_household())
    )
  );

-- Витрати: категорія й «на кого» теж мають бути зі свого бюджету.
drop policy if exists expenses_select on public.expenses;
create policy expenses_select on public.expenses
  for select using (household_id = (select public.my_household()));

drop policy if exists expenses_insert on public.expenses;
create policy expenses_insert on public.expenses
  for insert with check (
    household_id = (select public.my_household())
    and user_id = auth.uid()
    and exists (
      select 1 from public.categories c
      where c.id = category_id and c.household_id = (select public.my_household())
    )
    and (
      attributed_to is null
      or exists (
        select 1 from public.profiles p
        where p.id = attributed_to and p.household_id = (select public.my_household())
      )
    )
  );

drop policy if exists expenses_update on public.expenses;
create policy expenses_update on public.expenses
  for update
  using (household_id = (select public.my_household()))
  with check (
    household_id = (select public.my_household())
    and exists (
      select 1 from public.categories c
      where c.id = category_id and c.household_id = (select public.my_household())
    )
    and (
      attributed_to is null
      or exists (
        select 1 from public.profiles p
        where p.id = attributed_to and p.household_id = (select public.my_household())
      )
    )
  );

drop policy if exists expenses_delete on public.expenses;
create policy expenses_delete on public.expenses
  for delete using (household_id = (select public.my_household()));

-- ---------- Фото вішліста ----------
-- Storage сам записує в owner_id того, хто завантажив файл.
-- Бачити й видаляти фото можуть лише люди з того самого бюджету.
drop policy if exists wishlist_objects_all    on storage.objects;
drop policy if exists wishlist_objects_insert on storage.objects;
drop policy if exists wishlist_objects_select on storage.objects;
drop policy if exists wishlist_objects_delete on storage.objects;

create policy wishlist_objects_insert on storage.objects
  for insert with check (bucket_id = 'wishlist' and public.is_member());

create policy wishlist_objects_select on storage.objects
  for select using (
    bucket_id = 'wishlist'
    and owner_id in (
      select p.id::text from public.profiles p
      where p.household_id = (select public.my_household())
    )
  );

create policy wishlist_objects_delete on storage.objects
  for delete using (
    bucket_id = 'wishlist'
    and owner_id in (
      select p.id::text from public.profiles p
      where p.household_id = (select public.my_household())
    )
  );

commit;

-- Перевірка: один бюджет у PLN, у ньому ви двоє і всі ваші записи.
select
  h.name     as бюджет,
  h.currency as валюта,
  (select string_agg(p.name, ', ') from public.profiles p where p.household_id = h.id) as хто,
  (select count(*) from public.expenses e where e.household_id = h.id)       as витрат,
  (select count(*) from public.categories c where c.household_id = h.id)     as категорій,
  (select count(*) from public.wishlist_items w where w.household_id = h.id) as бажань
from public.households h;
