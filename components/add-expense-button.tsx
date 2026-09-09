"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import ExpenseDialog from "@/components/expense-dialog";
import type { Category } from "@/lib/types";

/** Кругла кнопка над мобільним меню + звичайна кнопка на десктопі. */
export default function AddExpenseButton({
  categories,
  variant = "fab",
}: {
  categories: Category[];
  variant?: "fab" | "inline";
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "fab" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Додати витрату"
          className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent to-violet-600 text-[#12101c] shadow-lg shadow-accent/25 transition-transform active:scale-95 md:bottom-8 md:right-8"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="btn btn-primary">
          <Plus className="h-4 w-4" />
          Витрата
        </button>
      )}

      <ExpenseDialog
        open={open}
        onClose={() => setOpen(false)}
        categories={categories}
      />
    </>
  );
}
