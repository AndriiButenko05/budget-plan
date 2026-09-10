"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, X } from "lucide-react";
import Modal from "@/components/modal";
import { addWishItem, updateWishItem } from "@/lib/actions/wishlist";
import { idle } from "@/lib/actions/shared";
import { downscaleImage } from "@/lib/image";
import { imageSrc } from "@/lib/image-src";
import { OWNER_LABELS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/client";
import type { WishOwner, WishlistItem } from "@/lib/types";

/** Обмеження бакета — 5 МБ, але великі фото ми стискаємо перед відправкою. */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_PICK_BYTES = 30 * 1024 * 1024;

type Props = {
  open: boolean;
  onClose: () => void;
  defaultOwner: WishOwner;
  /** Передано — режим редагування, інакше створення. */
  item?: WishlistItem;
};

export default function WishDialog({
  open,
  onClose,
  defaultOwner,
  item,
}: Props) {
  const router = useRouter();
  const editing = Boolean(item);
  const fileRef = useRef<HTMLInputElement>(null);

  const [forWhom, setForWhom] = useState<WishOwner>(item?.for_whom ?? defaultOwner);
  const [currency, setCurrency] = useState(item?.currency ?? "PLN");
  const [preview, setPreview] = useState<string | null>(
    item?.image_path ? imageSrc(item.image_path) : null,
  );
  /** Шлях, який піде в базу, якщо нового файлу не виберуть. */
  const [keptPath, setKeptPath] = useState(item?.image_path ?? "");
  /** Точка фото, яка має лишатись у кадрі карточки. */
  const [position, setPosition] = useState(item?.image_position ?? "50% 50%");
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError(null);

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Це не зображення");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_PICK_BYTES) {
      setError("Фото завелике — максимум 30 МБ");
      event.target.value = "";
      return;
    }

    setPreview(URL.createObjectURL(file));
    setPosition("50% 50%");
  }

  /** Точка натискання стає тією, що лишається в кадрі. */
  function pickPosition(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const percent = (value: number, size: number) =>
      Math.round(Math.min(100, Math.max(0, (value / size) * 100)));

    setPosition(
      `${percent(event.clientX - rect.left, rect.width)}% ` +
        `${percent(event.clientY - rect.top, rect.height)}%`,
    );
  }

  function clearFile() {
    if (fileRef.current) fileRef.current.value = "";
    setPreview(null);
    setKeptPath("");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.set("for_whom", forWhom);
    formData.delete("image");

    let imagePath = keptPath;

    const picked = fileRef.current?.files?.[0];
    if (picked) {
      const file = await downscaleImage(picked);

      if (file.size > MAX_UPLOAD_BYTES) {
        setError("Фото не вдалося стиснути — спробуй інше");
        setBusy(false);
        return;
      }

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
      imagePath = path;
    }

    formData.set("image_path", imagePath);

    const result = editing
      ? await updateWishItem(idle, formData)
      : await addWishItem(idle, formData);

    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    onClose();
    router.refresh();
  }

  return (
    <Modal
      open={open}
      title={editing ? "Редагувати позицію" : "Додати в вішліст"}
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {item && <input type="hidden" name="id" value={item.id} />}
        <input type="hidden" name="image_position" value={position} />

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
                {OWNER_LABELS[value]}
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
            defaultValue={item?.title ?? ""}
            className="field w-full"
          />
        </div>

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
            defaultValue={item?.url ?? ""}
            className="field w-full"
          />
        </div>

        <div>
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
              defaultValue={item?.price != null ? String(item.price) : ""}
              className="field min-w-0 flex-1 tabular-nums"
            />
            <select
              name="currency"
              aria-label="Валюта"
              value={currency}
              onChange={(e) => setCurrency(e.target.value === "UAH" ? "UAH" : "PLN")}
              className="field w-24 shrink-0 px-2"
            >
              <option value="PLN">PLN</option>
              <option value="UAH">UAH</option>
            </select>
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
            defaultValue={item?.note ?? ""}
            className="field w-full resize-none"
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
            <div className="space-y-1.5">
              {/*
                Рамка тієї ж висоти, що й у карточці, тож видно саме те,
                що буде у списку. Натискання або протягування вибирає точку,
                яка лишиться в кадрі.
              */}
              <div
                onPointerDown={(event) => {
                  setPicking(true);
                  event.currentTarget.setPointerCapture(event.pointerId);
                  pickPosition(event);
                }}
                onPointerMove={(event) => picking && pickPosition(event)}
                onPointerUp={() => setPicking(false)}
                onPointerCancel={() => setPicking(false)}
                className="relative h-40 cursor-crosshair touch-none select-none overflow-hidden rounded-xl border border-line"
              >
                {/* Локальний blob або наш маршрут — next/image тут не застосовний */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt=""
                  draggable={false}
                  style={{ objectPosition: position }}
                  className="pointer-events-none h-full w-full object-cover"
                />
                <div
                  className="absolute right-2 top-2 flex gap-1.5"
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  <label
                    htmlFor="image"
                    className="cursor-pointer rounded-lg bg-black/60 px-2 py-1.5 text-xs text-white"
                  >
                    Замінити
                  </label>
                  <button
                    type="button"
                    onClick={clearFile}
                    aria-label="Прибрати фото"
                    className="rounded-lg bg-black/60 p-1.5 text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-[11px] leading-snug text-muted">
                Натисни на фото там, де головне — саме ця частина буде видна в карточці
              </p>
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
            {editing ? "Зберегти" : "Додати"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
