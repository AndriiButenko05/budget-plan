-- ============================================================
--  our-budget — схема бази даних
--  Запусти цей файл цілком у Supabase → SQL Editor → New query
-- ============================================================

-- ---------- Типи ----------
do $$ begin
  create type wish_owner  as enum ('her', 'him');
exception when duplicate_object then null; end $$;

do $$ begin
  create type wish_status as enum ('idea', 'bought');
exception when duplicate_object then null; end $$;

-- ---------- Профілі ----------
-- Рядок тут = дозвіл на доступ. Немає рядка → користувач не бачить нічого.
create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  name       text not null,
  color      text not null default '#a78bfa',
  created_at timestamptz not null default now()
);

-- Головна перевірка доступу: чи є поточний користувач одним з нас двох.
create or replace function public.is_member()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

-- ---------- Категорії витрат ----------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  icon        text not null default '📦',
  color       text not null default '#94a3b8',
  sort_order  int  not null default 0,
  is_archived boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------- Витрати ----------
create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete restrict,
  -- на кого записана витрата; NULL = спільна
  attributed_to uuid references public.profiles(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  amount      numeric(12,2) not null check (amount > 0),
  spent_at    date not null default current_date,
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists expenses_spent_at_idx    on public.expenses (spent_at desc);
create index if not exists expenses_category_id_idx on public.expenses (category_id);
create index if not exists expenses_user_id_idx     on public.expenses (user_id);
create index if not exists expenses_attributed_to_idx on public.expenses (attributed_to);

-- ---------- Ліміти бюджету (місяць = 1-е число) ----------
create table if not exists public.budgets (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.categories(id) on delete cascade,
  month        date not null,
  limit_amount numeric(12,2) not null check (limit_amount >= 0),
  unique (category_id, month)
);

-- ---------- Вішліст ----------
create table if not exists public.wishlist_items (
  id         uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  for_whom   wish_owner  not null,
  title      text not null,
  url        text,
  note       text,
  price      numeric(12,2),
  currency   text not null default 'PLN' check (currency in ('PLN', 'UAH')),
  image_path text,
  status     wish_status not null default 'idea',
  created_at timestamptz not null default now()
);
create index if not exists wishlist_for_whom_idx on public.wishlist_items (for_whom, status);

-- ============================================================
--  RLS: доступ лише тим, хто є в profiles
-- ============================================================
alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.expenses       enable row level security;
alter table public.budgets        enable row level security;
alter table public.wishlist_items enable row level security;

-- profiles: бачимо обидва профілі, редагуємо лише свій
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (public.is_member());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Спільні дані: обоє можуть усе (це спільний бюджет)
drop policy if exists categories_all on public.categories;
create policy categories_all on public.categories
  for all using (public.is_member()) with check (public.is_member());

drop policy if exists budgets_all on public.budgets;
create policy budgets_all on public.budgets
  for all using (public.is_member()) with check (public.is_member());

drop policy if exists wishlist_all on public.wishlist_items;
create policy wishlist_all on public.wishlist_items
  for all using (public.is_member()) with check (public.is_member());

-- Витрати: читати/змінювати/видаляти може будь-хто з нас,
-- але створити запис можна лише від свого імені.
drop policy if exists expenses_select on public.expenses;
create policy expenses_select on public.expenses
  for select using (public.is_member());

drop policy if exists expenses_insert on public.expenses;
create policy expenses_insert on public.expenses
  for insert with check (public.is_member() and user_id = auth.uid());

drop policy if exists expenses_update on public.expenses;
create policy expenses_update on public.expenses
  for update using (public.is_member()) with check (public.is_member());

drop policy if exists expenses_delete on public.expenses;
create policy expenses_delete on public.expenses
  for delete using (public.is_member());

-- ============================================================
--  Storage: приватний бакет для фото вішліста
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wishlist', 'wishlist', false, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists wishlist_objects_all on storage.objects;
create policy wishlist_objects_all on storage.objects
  for all
  using  (bucket_id = 'wishlist' and public.is_member())
  with check (bucket_id = 'wishlist' and public.is_member());

-- ============================================================
--  Категорії за замовчуванням
-- ============================================================
insert into public.categories (name, icon, color, sort_order) values
  ('Їжа',        '🍔', '#f97316', 10),
  ('Житло',      '🏠', '#0ea5e9', 20),
  ('Транспорт',  '🚌', '#22c55e', 30),
  ('Розваги',    '🎬', '#a855f7', 40),
  ('Здоров''я',  '💊', '#ef4444', 50),
  ('Одяг',       '👕', '#ec4899', 60),
  ('Подарунки',  '🎁', '#eab308', 70),
  ('Інше',       '📦', '#94a3b8', 80)
on conflict do nothing;
