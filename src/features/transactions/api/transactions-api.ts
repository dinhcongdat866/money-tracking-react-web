import type { TransactionItem } from "../types";

export type PaginatedTransactionsResponse = {
  items: TransactionItem[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export async function getMonthlyTransactions(
  month: string,
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedTransactionsResponse> {
  const params = new URLSearchParams({
    month,
    page: String(page),
    limit: String(limit),
  });

  const res = await fetch(`/api/mock/transactions?${params.toString()}`, {
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

export type CreateTransactionData = {
  type: "income" | "expense";
  amount: number;
  categoryId: string;
  categoryName: string;
  date: string;
  note?: string;
};

export type UpdateTransactionData = CreateTransactionData;

export async function createTransaction(
  data: CreateTransactionData,
): Promise<TransactionItem> {
  const res = await fetch("/api/transactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to create transaction" }));
    throw new Error(error.error || "Failed to create transaction");
  }

  return res.json();
}

export async function updateTransaction(
  id: string,
  data: UpdateTransactionData,
): Promise<TransactionItem> {
  const res = await fetch(`/api/mock/transactions/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to update transaction" }));
    throw new Error(error.error || "Failed to update transaction");
  }

  return res.json();
}

export async function deleteTransaction(id: string): Promise<void> {
  const res = await fetch(`/api/mock/transactions/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to delete transaction" }));
    throw new Error(error.error || "Failed to delete transaction");
  }
}


