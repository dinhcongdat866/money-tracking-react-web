"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentTransactions } from "../hooks/use-recent-transactions";

export default function RecentTransactionsTable() {
  const { data, isLoading, isError } = useRecentTransactions();

  return (
    <Card>
      <CardHeader>
        <p className="text-xs font-medium text-muted-foreground">Recent Transactions</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : isError ? (
          <p className="text-sm text-destructive">Error loading recent transactions</p>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent transactions.</p>
        ) : (
          <div className="space-y-2">
            <ul className="divide-y divide-border">
              {data.map((tx) => (
                <li
                  key={tx.id}
                  className="grid grid-cols-[auto,1fr,auto] gap-2 py-2 text-sm"
                >
                  <span className="text-muted-foreground">
                    {new Date(tx.date).toLocaleDateString()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate">{tx.category.name}</p>
                    {tx.note && (
                      <p className="text-xs text-muted-foreground truncate">
                        {tx.note}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-right font-medium ${
                      tx.type === "income" ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {tx.type === "expense" ? "-" : "+"}
                    ${tx.amount.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}