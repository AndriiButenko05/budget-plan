export type WishOwner = "her" | "him";
export type Currency = "PLN" | "UAH";
export type WishStatus = "idea" | "bought";

export type Profile = {
  id: string;
  name: string;
  color: string;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  is_archived: boolean;
};

export type Expense = {
  id: string;
  /** Хто вніс запис. */
  user_id: string;
  /** На кого записана витрата; null — спільна. */
  attributed_to: string | null;
  category_id: string;
  amount: number;
  spent_at: string;
  note: string | null;
  created_at: string;
};

/** Витрата з підтягнутою категорією та тим, на кого вона записана. */
export type ExpenseRow = Expense & {
  category: Pick<Category, "id" | "name" | "icon" | "color"> | null;
  owner: Pick<Profile, "id" | "name" | "color"> | null;
};

export type Budget = {
  id: string;
  category_id: string;
  month: string;
  limit_amount: number;
};

export type WishlistItem = {
  id: string;
  created_by: string;
  for_whom: WishOwner;
  title: string;
  url: string | null;
  note: string | null;
  price: number | null;
  currency: Currency;
  image_path: string | null;
  /** Точка фото, яка лишається в кадрі карточки: «50% 30%». */
  image_position: string;
  status: WishStatus;
  created_at: string;
};
