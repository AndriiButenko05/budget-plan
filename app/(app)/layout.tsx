import { Suspense } from "react";
import { DesktopNav, MobileNav } from "@/components/nav";
import { ChipSkeleton } from "@/components/skeletons";
import { requireProfile } from "@/lib/auth";

/**
 * Шапка, меню й каркас не залежать від сесії, тому віддаються одразу
 * зі статичної оболонки. Усе, що читає куки, живе під <Suspense>
 * і приїжджає стрімом — цього вимагає cacheComponents.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-bg/70 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <span className="text-xl" aria-hidden>
            💜
          </span>
          <span className="mr-auto font-semibold tracking-tight">Наш бюджет</span>

          <DesktopNav />

          <Suspense fallback={<ChipSkeleton />}>
            <ProfileChip />
          </Suspense>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-5 md:pb-10">
        {children}
      </main>

      <MobileNav />
    </>
  );
}

async function ProfileChip() {
  const { profile } = await requireProfile();

  return (
    <span
      className="rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        color: profile.color,
        background: `color-mix(in srgb, ${profile.color} 16%, transparent)`,
      }}
    >
      {profile.name}
    </span>
  );
}
