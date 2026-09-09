"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Check, Loader2, Plus, X } from "lucide-react";
import { saveCategory, setCategoryArchived } from "@/lib/actions/settings";
import { idle } from "@/lib/actions/shared";
import type { Category } from "@/lib/types";

export default function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggleArchived(category: Category) {
    setBusyId(category.id);
    startTransition(async () => {
      await setCategoryArchived(category.id, !category.is_archived);
      setBusyId(null);
      router.refresh();
    });
  }

  const active = categories.filter((c) => !c.is_archived);
  const archived = categories.filter((c) => c.is_archived);

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {active.map((category) =>
          editingId === category.id ? (
            <li key={category.id}>
              <CategoryForm category={category} onDone={() => setEditingId(null)} />
            </li>
          ) : (
            <li
              key={category.id}
              className={`flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2 ${
                busyId === category.id ? "opacity-50" : ""
              }`}
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{
                  background: `color-mix(in srgb, ${category.color} 24%, transparent)`,
                }}
                aria-hidden
              >
                {category.icon}
              </span>
              <button
                type="button"
                onClick={() => setEditingId(category.id)}
                className="mr-auto text-left text-sm transition-colors hover:text-accent"
              >
                {category.name}
              </button>
              <button
                type="button"
                onClick={() => toggleArchived(category)}
                aria-label="Прибрати з активних"
                title="Прибрати з активних"
                className="rounded-lg p-1.5 text-muted transition-colors hover:text-danger"
              >
                <Archive className="h-4 w-4" />
              </button>
            </li>
          ),
        )}
      </ul>

      {adding ? (
        <CategoryForm onDone={() => setAdding(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="btn btn-ghost w-full text-sm"
        >
          <Plus className="h-4 w-4" />
          Нова категорія
        </button>
      )}

      {archived.length > 0 && (
        <details className="pt-1">
          <summary className="cursor-pointer text-xs text-muted">
            Архів ({archived.length})
          </summary>
          <ul className="mt-2 space-y-2">
            {archived.map((category) => (
              <li
                key={category.id}
                className="flex items-center gap-3 rounded-xl border border-line px-3 py-2 opacity-60"
              >
                <span aria-hidden>{category.icon}</span>
                <span className="mr-auto text-sm">{category.name}</span>
                <button
                  type="button"
                  onClick={() => toggleArchived(category)}
                  aria-label="Повернути в активні"
                  title="Повернути в активні"
                  className="rounded-lg p-1.5 text-muted transition-colors hover:text-ok"
                >
                  <ArchiveRestore className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function CategoryForm({
  category,
  onDone,
}: {
  category?: Category;
  onDone: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveCategory, idle);

  useEffect(() => {
    if (state.ok) {
      onDone();
      router.refresh();
    }
  }, [state, onDone, router]);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-2 rounded-xl border border-accent/40 bg-surface-2 p-2"
    >
      {category && <input type="hidden" name="id" value={category.id} />}

      <input
        name="icon"
        type="text"
        aria-label="Емодзі"
        maxLength={4}
        defaultValue={category?.icon ?? "📦"}
        className="field w-14 text-center"
      />
      <input
        name="name"
        type="text"
        aria-label="Назва категорії"
        required
        placeholder="Назва"
        defaultValue={category?.name ?? ""}
        className="field min-w-32 flex-1"
      />
      <input
        name="color"
        type="color"
        aria-label="Колір"
        defaultValue={category?.color ?? "#94a3b8"}
        className="h-11 w-12 cursor-pointer rounded-xl border border-line bg-surface p-1"
      />

      <button type="submit" aria-label="Зберегти" className="btn btn-primary px-3" disabled={pending}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
      </button>
      <button type="button" onClick={onDone} aria-label="Скасувати" className="btn btn-ghost px-3">
        <X className="h-4 w-4" />
      </button>

      {state.error && <p className="w-full text-sm text-danger">{state.error}</p>}
    </form>
  );
}
