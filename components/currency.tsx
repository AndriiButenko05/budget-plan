"use client";

import { createContext, useContext } from "react";
import type { BudgetCurrency } from "@/lib/types";

/**
 * Валюта бюджету того, хто дивиться сторінку. Кожен бюджет має свою
 * (у когось PLN, у когось EUR), а клієнтських компонентів, які малюють
 * суми, багато — тому через контекст, а не пропсами крізь усе дерево.
 */
const CurrencyContext = createContext<BudgetCurrency>("PLN");

export function CurrencyProvider({
  currency,
  children,
}: {
  currency: BudgetCurrency;
  children: React.ReactNode;
}) {
  return <CurrencyContext value={currency}>{children}</CurrencyContext>;
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
