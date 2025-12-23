import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  getMonthKey,
  getAllTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  MOCK_TRANSACTIONS,
} from "./mock-data";

let snapshot: typeof MOCK_TRANSACTIONS;

beforeEach(() => {
  snapshot = [...MOCK_TRANSACTIONS];
});

afterEach(() => {
  // restore global mock data
  MOCK_TRANSACTIONS.length = 0;
  MOCK_TRANSACTIONS.push(...snapshot);
});

describe("getMonthKey", () => {
  it("formats YYYY-MM with leading zero", () => {
    const date = new Date("2025-02-15T00:00:00.000Z");
    expect(getMonthKey(date)).toBe("2025-02");
  });
});

describe("mock transactions helpers", () => {
  it("returns a shallow copy of transactions", () => {
    const all = getAllTransactions();
    expect(all).toEqual(MOCK_TRANSACTIONS);
    expect(all).not.toBe(MOCK_TRANSACTIONS);
  });

  it("adds a transaction and generates id", () => {
    const created = addTransaction({
      amount: 10,
      type: "income",
      category: { id: "c", name: "Cat" },
      date: new Date().toISOString(),
      note: "test",
    });

    expect(created.id).toBeTruthy();
    expect(MOCK_TRANSACTIONS.find((t) => t.id === created.id)).toBeTruthy();
  });

  it("updates an existing transaction", () => {
    const target = MOCK_TRANSACTIONS[0];
    const updated = updateTransaction(target.id, { amount: target.amount + 5 });
    expect(updated?.amount).toBe(target.amount + 5);
  });

  it("deletes an existing transaction", () => {
    const target = MOCK_TRANSACTIONS[0];
    const ok = deleteTransaction(target.id);
    expect(ok).toBe(true);
    expect(MOCK_TRANSACTIONS.find((t) => t.id === target.id)).toBeUndefined();
  });
});

