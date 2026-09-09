-- ============================================================
--  Спільні витрати.
--  Запустити один раз у SQL Editor.
--
--  user_id лишається автором запису (хто вніс), а нове поле
--  attributed_to каже, на кого витрата записана:
--    конкретний профіль → його витрата
--    NULL               → спільна (продукти, житло тощо)
--
--  Наявні записи отримують свого ж автора, тож історія не змінюється.
-- ============================================================

alter table public.expenses
  add column if not exists attributed_to uuid references public.profiles(id) on delete restrict;

update public.expenses
set attributed_to = user_id
where attributed_to is null;

create index if not exists expenses_attributed_to_idx
  on public.expenses (attributed_to);

-- Перевірка: скільки записів на кого
select coalesce(p.name, 'Спільні') as кому, count(*) as записів, sum(e.amount) as сума
from public.expenses e
left join public.profiles p on p.id = e.attributed_to
group by p.name
order by сума desc nulls last;
