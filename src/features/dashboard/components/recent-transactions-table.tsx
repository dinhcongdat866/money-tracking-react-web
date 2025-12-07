"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentTransactions } from "../hooks/use-recent-transactions";
import { TransactionListItem } from "@/features/transactions/components/TransactionListItem";

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
          <div className="divide-y divide-border">
            {data.map((tx) => (
              <TransactionListItem
                key={tx.id}
                transaction={tx}
                showFullDateTime
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}