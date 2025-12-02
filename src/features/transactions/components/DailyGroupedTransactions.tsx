
import type { GroupedTransactions } from "../types";
import { TransactionListItem } from "./TransactionListItem";

type DailyGroupedTransactionsProps = {
  groups: GroupedTransactions;
};

export function DailyGroupedTransactions({
  groups,
}: DailyGroupedTransactionsProps) {
  if (!groups || groups.length === 0) {
    return (
      <section className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          No transactions for this month.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {groups.map((group) => {
        const date = new Date(group.date);
        const isPositive = group.dailyTotal >= 0;

        return (
          <div
            key={group.date}
            className="rounded-lg border bg-card p-4 space-y-2"
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium">
                {date.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p
                className={`text-xs font-semibold ${
                  isPositive ? "text-emerald-500" : "text-rose-500"
                }`}
              >
                {isPositive ? "+" : "-"}$
                {Math.abs(group.dailyTotal).toLocaleString()}
              </p>
            </div>
            <div className="divide-y divide-border">
              {group.transactions.map((tx) => (
                <TransactionListItem key={tx.id} transaction={tx} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}


