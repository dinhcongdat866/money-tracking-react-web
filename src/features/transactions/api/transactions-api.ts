import type { TransactionItem, MonthlySummary } from "../types";
import { apiRequest } from "@/lib/api-client";
import {
  validateMonth,
  validatePagination,
  validateAmount,
  validateDate,
  validateTransactionType,
  validateCategory,
} from "@/lib/validation";

export type PaginatedTransactionsResponse = {
  items: TransactionItem[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  summary?: MonthlySummary;
};

export async function getMonthlyTransactions(
  month: string,
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedTransactionsResponse> {
  // Input validation
  validateMonth(month);
  const { page: validatedPage, limit: validatedLimit } = validatePagination(page, limit);

  const params = new URLSearchParams({
    month,
    page: String(validatedPage),
    limit: String(validatedLimit),
  });

  return apiRequest<PaginatedTransactionsResponse>(
    `/api/mock/transactions?${params.toString()}`,
    { cache: "no-store" },
  );
}

export async function getTransactionDetail(
  id: string,
): Promise<TransactionItem> {
  // Input validation
  if (!id || typeof id !== 'string') {
    throw new Error("Transaction ID is required");
  }

  return apiRequest<TransactionItem>(
    `/api/mock/transactions/${id}`,
    { cache: "no-store" },
  );
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
  // Input validation
  validateAmount(data.amount);
  validateDate(data.date);
  validateTransactionType(data.type);
  validateCategory({ id: data.categoryId, name: data.categoryName });

  return apiRequest<TransactionItem>("/api/mock/transactions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTransaction(
  id: string,
  data: UpdateTransactionData,
): Promise<TransactionItem> {
  // Input validation
  if (!id || typeof id !== 'string') {
    throw new Error("Transaction ID is required");
  }
  validateAmount(data.amount);
  validateDate(data.date);
  validateTransactionType(data.type);
  validateCategory({ id: data.categoryId, name: data.categoryName });

  return apiRequest<TransactionItem>(`/api/mock/transactions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  // Input validation
  if (!id || typeof id !== 'string') {
    throw new Error("Transaction ID is required");
  }

  await apiRequest<void>(`/api/mock/transactions/${id}`, {
    method: "DELETE",
  });
}


