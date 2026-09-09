import type { WishOwner } from "@/lib/types";

/** Підписи колонок вішліста — щоб не розходились між сторінкою та формою. */
export const OWNER_LABELS: Record<WishOwner, string> = {
  her: "Для неї",
  him: "Для нього",
};

/**
 * Спільні витрати — це не людина, тому в базі вони позначені як NULL.
 * Для графіків та ключів у React потрібен рядок, звідси окремий id.
 */
export const SHARED = {
  id: "shared",
  name: "Спільні",
  color: "#a78bfa",
} as const;
