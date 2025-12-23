import type { TransactionItem } from "@/features/transactions/types";

export const revalidate = 60 * 60 * 24; // ISR: regenerate every 24 hours

type PageProps = {
  params: { month: string };
};

function getMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function computeSummary(transactions: TransactionItem[]) {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    income,
    expense,
    net: income - expense,
  };
}

function groupByDate(transactions: TransactionItem[]) {
  const map = new Map<
    string,
    { date: string; items: TransactionItem[]; dailyNet: number }
  >();

  for (const tx of transactions) {
    const dateKey = new Date(tx.date).toISOString().slice(0, 10);
    const existing = map.get(dateKey) ?? { date: dateKey, items: [], dailyNet: 0 };
    const signed = tx.type === "income" ? tx.amount : -tx.amount;
    existing.dailyNet += signed;
    existing.items.push(tx);
    map.set(dateKey, existing);
  }

  const groups = Array.from(map.values());
  groups.sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
  for (const g of groups) {
    g.items.sort((a, b) => (a.date < b.date ? 1 : -1));
  }
  return groups;
}

async function fetchMonthlyTransactions(month: string) {
  const params = new URLSearchParams({ month, limit: "500" });
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const res = await fetch(`${baseUrl}/api/mock/transactions?${params.toString()}`, {
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error("Failed to load monthly report");
  }

  const json = await res.json();
  // API returns paginated shape; pick items if present, else fallback to raw list
  return Array.isArray(json) ? (json as TransactionItem[]) : (json.items as TransactionItem[]);
}

export default async function MonthlyReportPage({ params }: PageProps) {
  const { month } = params;
  const monthKey = month ?? "";
  const transactions = await fetchMonthlyTransactions(monthKey);
  const summary = computeSummary(transactions);
  const grouped = groupByDate(transactions);

  return (
    <main className="p-6 space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Public monthly report</p>
        <h1 className="text-2xl font-semibold">Report • {getMonthLabel(monthKey)}</h1>
        <p className="text-xs text-muted-foreground">
          This page uses ISR (revalidate {revalidate}s). Data is mock and refreshed on rebuild.
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Income</p>
          <p className="text-xl font-semibold text-emerald-600">
            ${summary.income.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Expense</p>
          <p className="text-xl font-semibold text-rose-600">
            ${summary.expense.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Net</p>
          <p
            className={`text-xl font-semibold ${
              summary.net >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {summary.net >= 0 ? "+" : "-"}${Math.abs(summary.net).toLocaleString()}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        {grouped.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions for this month.</p>
        ) : (
          grouped.map((group) => (
            <div key={group.date} className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {new Date(group.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p
                  className={`text-xs font-semibold ${
                    group.dailyNet >= 0 ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {group.dailyNet >= 0 ? "+" : "-"}${Math.abs(group.dailyNet).toLocaleString()}
                </p>
              </div>
              <div className="divide-y divide-border">
                {group.items.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {tx.note || tx.category.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tx.category.name} ·{" "}
                        {new Date(tx.date).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        tx.type === "income" ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}${tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}

