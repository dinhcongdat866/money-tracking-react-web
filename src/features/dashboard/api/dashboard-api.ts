import { Balance, CategoryExpense, Summary, TimeRange, Transaction } from "../types";
import type { PaginatedTransactionsResponse } from "@/features/transactions/api/transactions-api";

export async function getBalance(): Promise<Balance> {
    const res = await fetch("/api/mock/balance", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch balance");
    return res.json();
}

export async function getMostSpentExpenses(timeRange: TimeRange, limit: number): Promise<CategoryExpense[]> {
    const res = await fetch(`/api/mock/expenses/top?timeRange=${timeRange}&limit=${limit}`, { cache: "force-cache" });
    if (!res.ok) {
        throw new Error("Failed to fetch top expenses");
    }
    return res.json();
}

export async function getSummary(timeRange: TimeRange): Promise<Summary> {
    const res = await fetch(`/api/mock/summary?timeRange=${timeRange}`, { cache: "force-cache" });
    if (!res.ok) {
        throw new Error("Failed to fetch summary");
    }
    return res.json();
}

export async function getRecentTransactions(
    page: number = 1,
    limit: number = 10,
): Promise<PaginatedTransactionsResponse> {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });
    const res = await fetch(`/api/mock/transactions?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) {
        throw new Error("Failed to fetch recent transactions");
    }
    return res.json();
}
