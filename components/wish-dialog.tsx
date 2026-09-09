"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, X } from "lucide-react";
import Modal from "@/components/modal";
import { addWishItem } from "@/lib/actions/wishlist";
import { idle } from "@/lib/actions/shared";
import { createClient } from "@/lib/supabase/client";
import type { WishOwner } from "@/lib/types";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type Props = {
  open: boolean;
  onClose: () => void;
  defaultOwner: WishOwner;
  labels: Record<WishOwner, string>;
};

export default function WishDialog({ open, onClose, defaultOwner, labels }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [forWhom, setForWhom] = useState<WishOwner>(defaultOwner);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError(null);

    if (!file) {
      setPreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Це не зображення");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Фото завелике — максимум 5 МБ");
      event.target.value = "";
      return;
    }

    setPreview(URL.createObjectURL(file));
  }

  function clearFile() {
    if (fileRef.current) fileRef.current.value = "";
    setPreview(null);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.set("for_whom", forWhom);
    formData.delete("image");

    const file = fileRef.current?.files?.[0];
    if (file) {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await createClient()
        .storage.from("wishlist")
        .upload(path, file, { contentType: file.type });

      if (uploadError) {
        setError("Не вдалося завантажити фото");
        setBusy(false);
        return;
      }
      formData.set("image_path", path);
    }

    const result = await addWishItem(idle, formData);
    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    clearFile();
    onClose();
    router.refresh();
  }

  return (
    <Modal open={open} title="Додати в вішліст" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {(["her", "him"] as const).map((value) => {
            const active = forWhom === value;
            const color = value === "her" ? "var(--her)" : "var(--him)";
            return (
              <button
                key={value}
                type="button"
                onClick={() => setForWhom(value)}
                aria-pressed={active}
                className={`rounded-xl border py-2.5 text-sm transition-colors ${
                  active ? "text-text" : "border-line bg-surface-2 text-muted"
                }`}
                style={
                  active
                    ? {
                        borderColor: color,
                        background: `color-mix(in srgb, ${color} 20%, transparent)`,
                      }
                    : undefined
                }
              >
                {labels[value]}
              </button>
            );
          })}
        </div>

        <div>
          <label htmlFor="title" className="mb-1.5 block text-xs font-medium text-muted">
            Що це
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            autoFocus
            placeholder="Навушники, поїздка, сукня…"
            className="field"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label htmlFor="url" className="mb-1.5 block text-xs font-medium text-muted">
              Посилання
            </label>
            <input
              id="url"
              name="url"
              type="text"
              inputMode="url"
              placeholder="необовʼязково"
              className="field"
            />
          </div>
          <div className="sm:w-40">
            <label htmlFor="price" className="mb-1.5 block text-xs font-medium text-muted">
              Ціна
            </label>
            <div className="flex gap-1.5">
              <input
                id="price"
                name="price"
                type="text"
                inputMode="decimal"
                placeholder="—"
                className="field min-w-0 flex-1 tabular-nums"
              />
              <select
                name="currency"
                aria-label="Валюта"
                defaultValue="PLN"
                className="field w-20 px-1.5"
              >
                <option value="PLN">PLN</option>
                <option value="UAH">UAH</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="note" className="mb-1.5 block text-xs font-medium text-muted">
            Опис
          </label>
          <textarea
            id="note"
            name="note"
            rows={2}
            placeholder="колір, розмір, чому хочеться…"
            className="field resize-none"
          />
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted">Фото</span>
          {/* Input лишається змонтованим завжди, інакше вибраний файл губиться */}
          <input
            ref={fileRef}
            id="image"
            name="image"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={pickFile}
          />
          {preview ? (
            <div className="relative overflow-hidden rounded-xl border border-line">
              {/* Локальний blob — next/image тут не потрібен */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="" className="max-h-48 w-full object-cover" />
              <button
                type="button"
                onClick={clearFile}
                aria-label="Прибрати фото"
                className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="image"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface-2 py-6 text-sm text-muted transition-colors hover:border-accent hover:text-text"
            >
              <ImagePlus className="h-4 w-4" />
              Вибрати фото
            </label>
          )}
        </div>

        {error && (
          <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn btn-ghost flex-1">
            Скасувати
          </button>
          <button type="submit" className="btn btn-primary flex-1" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Додати
          </button>
        </div>
      </form>
    </Modal>
  );
}
