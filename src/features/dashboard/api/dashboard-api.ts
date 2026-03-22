import { Balance, CategoryExpense, Summary, TimeRange } from "../types";
import type { PaginatedTransactionsResponse } from "@/features/transactions/api/transactions-api";
import { apiRequest } from "@/lib/api-client";

export async function getBalance(): Promise<Balance> {
    return apiRequest<Balance>("/api/balance", { cache: "no-store" });
}

export async function getMostSpentExpenses(timeRange: TimeRange, limit: number): Promise<CategoryExpense[]> {
    return apiRequest<CategoryExpense[]>(
        `/api/expenses/top?timeRange=${timeRange}&limit=${limit}`,
        { cache: "force-cache" },
    );
}

export async function getSummary(timeRange: TimeRange): Promise<Summary> {
    return apiRequest<Summary>(`/api/summary?timeRange=${timeRange}`, { cache: "force-cache" });
}

export async function getRecentTransactions(
    page: number = 1,
    limit: number = 10,
): Promise<PaginatedTransactionsResponse> {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });
    return apiRequest<PaginatedTransactionsResponse>(`/api/transactions?${params.toString()}`, {
        cache: "no-store",
    });
}
