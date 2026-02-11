"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTransactionDetail } from "./hooks/useTransactionDetail";
import { useDeleteTransaction } from "./hooks/useDeleteTransaction";
import { AddTransactionModal } from "./components/AddTransactionModal";

type TransactionDetailPageProps = {
  id: string;
};

export function TransactionDetailPage({ id }: TransactionDetailPageProps) {
  const router = useRouter();
  const { data: tx, isLoading, isError } = useTransactionDetail(id);
  const deleteMutation = useDeleteTransaction();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDelete = async () => {
    if (!tx) return;
    
    if (confirm(`Are you sure you want to delete this transaction?`)) {
      try {
        await deleteMutation.mutateAsync(tx.id);
        router.push("/transactions");
      } catch (error) {
        // Error is handled by mutation hook
        console.error("Failed to delete transaction:", error);
      }
    }
  };

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
          {isError ? "Failed to load transaction." : "Transaction not found."}
        </p>
      </div>
    );
  }

  const date = new Date(tx.date);

  return (
    <>
      <div className="flex w-full flex-col gap-4 px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Transaction Detail
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
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
        {deleteMutation.isError && (
          <p className="text-sm text-destructive">
            Failed to delete transaction. Please try again.
          </p>
        )}
      </div>

      <AddTransactionModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        transaction={tx}
      />
    </>
  );
}


