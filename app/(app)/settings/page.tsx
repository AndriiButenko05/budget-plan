import { Suspense } from "react";
import BudgetManager from "@/components/settings/budget-manager";
import CategoryManager from "@/components/settings/category-manager";
import ProfileForm from "@/components/settings/profile-form";
import SignOutButton from "@/components/sign-out-button";
import { CardSkeleton } from "@/components/skeletons";
import { requireProfile } from "@/lib/auth";
import { currentMonthKey } from "@/lib/dates";
import { getBudgets, getCategories, getProfiles } from "@/lib/queries";

export const metadata = { title: "Налаштування — Наш бюджет" };

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <h1 className="px-1 text-lg font-semibold">Налаштування</h1>
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-5">
      <CardSkeleton height={210} />
      <CardSkeleton height={260} />
      <CardSkeleton height={240} />
    </div>
  );
}

async function SettingsContent() {
  const { supabase, profile } = await requireProfile();
  const month = currentMonthKey();

  const [categories, budgets, profiles] = await Promise.all([
    getCategories(supabase, { includeArchived: true }),
    getBudgets(supabase, month),
    getProfiles(supabase),
  ]);

  const activeCategories = categories.filter((c) => !c.is_archived);

  return (
    <>
      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold">Мій профіль</h2>
        <ProfileForm profile={profile} />

        <div className="mt-5 border-t border-line pt-4">
          <p className="mb-2 text-xs text-muted">Доступ до сайту мають:</p>
          <ul className="flex flex-wrap gap-2">
            {profiles.map((p) => (
              <li
                key={p.id}
                className="rounded-full px-2.5 py-1 text-xs font-medium"
                style={{
                  color: p.color,
                  background: `color-mix(in srgb, ${p.color} 16%, transparent)`,
                }}
              >
                {p.name}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-sm font-semibold">Категорії</h2>
        <p className="mb-4 text-xs text-muted">
          Категорію не можна видалити — лише прибрати з активних, щоб історія витрат
          залишилась цілою.
        </p>
        <CategoryManager categories={categories} />
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold">Ліміти бюджету</h2>
        <BudgetManager categories={activeCategories} budgets={budgets} month={month} />
      </section>

      <div className="pt-1">
        <SignOutButton />
      </div>
    </>
  );
}
