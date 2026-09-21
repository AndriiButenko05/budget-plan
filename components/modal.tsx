"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

/** Модалка: по центру на десктопі, «шухляда» знизу на телефоні. */
export default function Modal({ open, title, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Прибираємо саме властивість, а не відновлюємо збережене значення:
      // якщо ефект перезапуститься вже при заблокованій прокрутці, у
      // «попередньому» опиниться hidden, і сторінка лишиться без скролу.
      document.body.style.removeProperty("overflow");
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="rise relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-line bg-surface p-5 sm:max-w-md sm:rounded-2xl"
      >
        <div className="mb-4 flex items-center gap-3">
          <h2 className="mr-auto text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрити"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
