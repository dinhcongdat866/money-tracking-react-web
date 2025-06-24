import { Balance, CategoryExpense, Summary, TimeRange } from "../types";

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
