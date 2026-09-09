"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Modal from "@/components/modal";
import { addExpense, updateExpense } from "@/lib/actions/expenses";
import { idle } from "@/lib/actions/shared";
import { toISODate } from "@/lib/dates";
import { SHARED } from "@/lib/labels";
import type { Category, ExpenseRow, Profile } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  profiles: Profile[];
  /** Передано — режим редагування, інакше створення. */
  expense?: ExpenseRow;
};

export default function ExpenseDialog({
  open,
  onClose,
  categories,
  profiles,
  expense,
}: Props) {
  const router = useRouter();
  const editing = Boolean(expense);
  const [state, formAction, pending] = useActionState(
    editing ? updateExpense : addExpense,
    idle,
  );

  // У режимі редагування діалог перемонтовується під кожен запис (key),
  // тому початкове значення з useState завжди актуальне.
  const [categoryId, setCategoryId] = useState(
    expense?.category_id ?? categories[0]?.id ?? "",
  );
  /** Порожній рядок — спільна витрата. */
  const [ownerId, setOwnerId] = useState(expense?.attributed_to ?? "");

  useEffect(() => {
    if (state.ok) {
      onClose();
      router.refresh();
    }
  }, [state, onClose, router]);

  return (
    <Modal
      open={open}
      title={editing ? "Редагувати витрату" : "Нова витрата"}
      onClose={onClose}
    >
      <form action={formAction} className="space-y-4">
        {expense && <input type="hidden" name="id" value={expense.id} />}
        <input type="hidden" name="category_id" value={categoryId} />
        <input type="hidden" name="attributed_to" value={ownerId} />

        <div>
          <label htmlFor="amount" className="mb-1.5 block text-xs font-medium text-muted">
            Сума, PLN
          </label>
          <input
            id="amount"
            name="amount"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            autoComplete="off"
            required
            autoFocus
            defaultValue={expense ? String(expense.amount) : ""}
            className="field w-full text-2xl font-semibold tabular-nums"
          />
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted">На кого</span>
          <div className="grid grid-cols-3 gap-2">
            {[
              ...profiles.map((p) => ({ id: p.id, name: p.name, color: p.color })),
              { id: "", name: SHARED.name, color: SHARED.color },
            ].map((owner) => {
              const active = owner.id === ownerId;
              return (
                <button
                  key={owner.id || "shared"}
                  type="button"
                  onClick={() => setOwnerId(owner.id)}
                  aria-pressed={active}
                  className={`truncate rounded-xl border py-2 text-xs transition-colors ${
                    active ? "text-text" : "border-line bg-surface-2 text-muted"
                  }`}
                  style={
                    active
                      ? {
                          borderColor: owner.color,
                          background: `color-mix(in srgb, ${owner.color} 22%, transparent)`,
                        }
                      : undefined
                  }
                >
                  {owner.name}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted">Категорія</span>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((category) => {
              const active = category.id === categoryId;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategoryId(category.id)}
                  aria-pressed={active}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2.5 text-[11px] leading-tight transition-colors ${
                    active
                      ? "border-transparent text-text"
                      : "border-line bg-surface-2 text-muted hover:text-text"
                  }`}
                  style={
                    active
                      ? {
                          background: `color-mix(in srgb, ${category.color} 26%, transparent)`,
                          borderColor: category.color,
                        }
                      : undefined
                  }
                >
                  <span className="text-lg" aria-hidden>
                    {category.icon}
                  </span>
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="spent_at" className="mb-1.5 block text-xs font-medium text-muted">
            Дата
          </label>
          <input
            id="spent_at"
            name="spent_at"
            type="date"
            required
            defaultValue={expense?.spent_at ?? toISODate(new Date())}
            className="field w-full"
          />
        </div>

        <div>
          <label htmlFor="note" className="mb-1.5 block text-xs font-medium text-muted">
            Нотатка
          </label>
          <input
            id="note"
            name="note"
            type="text"
            placeholder="необовʼязково"
            autoComplete="off"
            defaultValue={expense?.note ?? ""}
            className="field w-full"
          />
        </div>

        {state.error && (
          <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn btn-ghost flex-1">
            Скасувати
          </button>
          <button type="submit" className="btn btn-primary flex-1" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Зберегти" : "Додати"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
