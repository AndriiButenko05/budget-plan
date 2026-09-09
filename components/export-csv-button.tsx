"use client";

import { Download } from "lucide-react";
import type { ExpenseRow } from "@/lib/types";

/** Вивантажує показані витрати у CSV (Excel-сумісний, з BOM). */
export default function ExportCsvButton({
  expenses,
  filename,
}: {
  expenses: ExpenseRow[];
  filename: string;
}) {
  function download() {
    const header = ["Дата", "Категорія", "Хто", "Сума (PLN)", "Нотатка"];
    const rows = expenses.map((expense) => [
      expense.spent_at,
      expense.category?.name ?? "",
      expense.author?.name ?? "",
      expense.amount.toFixed(2),
      expense.note ?? "",
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");

    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={expenses.length === 0}
      className="btn btn-ghost text-xs"
    >
      <Download className="h-3.5 w-3.5" />
      CSV
    </button>
  );
}
