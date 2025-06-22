import { Balance } from "../types";

export async function getBalance(): Promise<Balance> {
    const res = await fetch("/api/mock/balance", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch balance");
    return res.json();
}