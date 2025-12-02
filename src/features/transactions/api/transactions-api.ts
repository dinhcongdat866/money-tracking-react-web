import type { TransactionItem } from "../types";

export async function getMonthlyTransactions(
  month: string,
): Promise<TransactionItem[]> {
  const res = await fetch(`/api/mock/transactions?month=${month}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch transactions");
  }

  return res.json();
}

export async function getTransactionDetail(
  id: string,
): Promise<TransactionItem> {
  const res = await fetch(`/api/mock/transactions/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch transaction detail");
  }

  return res.json();
}


