export type WishOwner = "her" | "him";
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
  user_id: string;
  category_id: string;
  amount: number;
  spent_at: string;
  note: string | null;
  created_at: string;
};

/** Витрата з підтягнутими назвами категорії та автора. */
export type ExpenseRow = Expense & {
  category: Pick<Category, "id" | "name" | "icon" | "color"> | null;
  author: Pick<Profile, "id" | "name" | "color"> | null;
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
  image_path: string | null;
  status: WishStatus;
  created_at: string;
};
