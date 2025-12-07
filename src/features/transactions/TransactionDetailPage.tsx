"use client";

import { useTransactionDetail } from "./hooks/useTransactionDetail";

type TransactionDetailPageProps = {
  id: string;
};

export function TransactionDetailPage({ id }: TransactionDetailPageProps) {
  const { data: tx, isLoading, isError } = useTransactionDetail(id);

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
        <p className="text-sm text-muted-foreground">Loading transaction...</p>
      </div>
    );
  }

  if (isError || !tx) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
        <p className="text-sm text-destructive">
          Transaction not found or failed to load.
        </p>
      </div>
    );
  }

  const date = new Date(tx.date);

  return (
    <div className="flex w-full flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Transaction Detail
      </h1>
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <p className="text-lg font-semibold">
          {tx.type === "expense" ? "-" : "+"}
          {tx.amount.toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground">
          {tx.category.name} ·{" "}
          {date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        {tx.note && <p className="text-sm">{tx.note}</p>}
      </div>
    </div>
  );
}


