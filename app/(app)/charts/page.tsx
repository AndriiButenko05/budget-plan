import {
  CategoryPie,
  CumulativeLine,
  MonthsBar,
  OwnerCompareBar,
} from "@/components/charts/lazy";
import {
  byCategory,
  byMonth,
  categoryByOwner,
  cumulativeByDay,
  ownerSeries,
  total,
} from "@/lib/aggregate";
import { requireProfile } from "@/lib/auth";
import {
  currentMonthKey,
  daysInMonth,
  lastMonths,
  monthRange,
  shiftMonth,
  toISODate,
} from "@/lib/dates";
import { formatMoney, formatMonthYear } from "@/lib/format";
import { getCategories, getExpensesBetween, getProfiles } from "@/lib/queries";

export const metadata = { title: "Графіки — Наш бюджет" };

const MONTHS_ON_CHART = 12;

export default async function ChartsPage() {
  const { supabase } = await requireProfile();

  const month = currentMonthKey();
  const previousMonth = shiftMonth(month, -1);
  const months = lastMonths(month, MONTHS_ON_CHART);

  const [rangeStart] = monthRange(months[0]);
  const [, rangeEnd] = monthRange(month);

  const [allExpenses, categories, profiles] = await Promise.all([
    // Підписи категорій і людей беремо окремими списками, тож
    // джойни на кожен рядок за рік тут ні до чого.
    getExpensesBetween(supabase, rangeStart, rangeEnd, { lean: true }),
    getCategories(supabase, { includeArchived: true }),
    getProfiles(supabase),
  ]);

  const thisMonth = allExpenses.filter((e) => e.spent_at.startsWith(month));
  const lastMonth = allExpenses.filter((e) => e.spent_at.startsWith(previousMonth));

  const currentSeries = cumulativeByDay(thisMonth, month);
  const previousSeries = cumulativeByDay(lastMonth, previousMonth);
  const today = Number(toISODate(new Date()).slice(8, 10));

  const cumulative = Array.from(
    { length: Math.max(daysInMonth(month), daysInMonth(previousMonth)) },
    (_, index) => ({
      day: index + 1,
      current: index + 1 <= today ? (currentSeries[index]?.total ?? null) : null,
      previous: previousSeries[index]?.total ?? null,
    }),
  );

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between px-1">
        <h1 className="text-lg font-semibold">Графіки</h1>
        <p className="text-xs text-muted">{formatMonthYear(`${month}-01`)}</p>
      </div>

      <section className="card p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Розподіл по категоріях</h2>
          <span className="text-sm font-semibold tabular-nums">
            {formatMoney(total(thisMonth))}
          </span>
        </div>
        <CategoryPie slices={byCategory(thisMonth, categories)} />
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold">Витрати за {MONTHS_ON_CHART} місяців</h2>
        <MonthsBar data={byMonth(allExpenses, months)} highlight={month} />
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-sm font-semibold">Темп витрат</h2>
        <p className="mb-3 text-xs text-muted">
          Наростаюча сума по днях — видно, чи витрачаємо швидше за минулий місяць
        </p>
        <CumulativeLine data={cumulative} />
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold">Хто скільки витратив</h2>
        <OwnerCompareBar
          data={categoryByOwner(thisMonth, categories, profiles)}
          series={ownerSeries(profiles)}
        />
      </section>
    </div>
  );
}
