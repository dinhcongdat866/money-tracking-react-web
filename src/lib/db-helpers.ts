import type { Transaction } from "@prisma/client";
import type { TransactionItem } from "@/features/transactions/types";

/**
 * Maps a Prisma Transaction row to the TransactionItem interface
 * used across the entire frontend — keeps API contract unchanged.
 */
export function toTransactionItem(tx: Transaction): TransactionItem {
  return {
    id: tx.id,
    amount: tx.amount,
    type: tx.type as "income" | "expense",
    category: {
      id: tx.categoryId,
      name: tx.categoryName,
      icon: tx.categoryIcon ?? undefined,
    },
    date: tx.date,
    note: tx.note ?? undefined,
    version: tx.version,
    updatedAt: tx.updatedAt.getTime(),
  };
}
