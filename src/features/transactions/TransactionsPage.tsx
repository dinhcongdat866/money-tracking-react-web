"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { MonthSelector } from "./components/MonthSelector";
import { MonthlySummaryReport } from "./components/MonthlySummaryReport";
import { MonthlySummarySkeleton } from "./components/MonthlySummarySkeleton";
import { DailyGroupedTransactions } from "./components/DailyGroupedTransactions";
import { DailyTransactionsSkeleton } from "./components/DailyTransactionsSkeleton";
import { AddTransactionModal } from "./components/AddTransactionModal";
import type { GroupedTransactions, MonthlySummary, TransactionItem } from "./types";
import { useMonthlyTransactions } from "./hooks/useMonthlyTransactions";
import { useDeleteTransaction } from "./hooks/useDeleteTransaction";
import { useMonthlySummary } from "./hooks/useMonthlySummary";
import { useIsMutating } from "@tanstack/react-query";
import { usePrefetchNextMonth } from "./hooks/usePrefetchNextMonth";
import { ReactQueryErrorBoundary } from "@/components/ReactQueryErrorBoundary";
import { ErrorBoundaryTestButton } from "@/components/ErrorBoundaryTestButton";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { 
  openAddTransactionModal, 
  closeAddTransactionModal,
  openEditTransactionModal,
  closeEditTransactionModal,
} from "@/store/slices/ui/uiSlice";
import { 
  selectIsAddTransactionModalOpen,
  selectEditingTransaction,
} from "@/store/slices/ui/uiSelectors";

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function getRecentMonthKeys(count: number = 3): string[] {
  const now = new Date();
  const months: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(getMonthKey(d));
  }
  return months;
}

export default function TransactionsPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey(now));
  
  const dispatch = useAppDispatch();
  const isAddModalOpen = useAppSelector(selectIsAddTransactionModalOpen);
  const editingTransaction = useAppSelector(selectEditingTransaction);
  
  const deleteMutation = useDeleteTransaction();
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMonthlyTransactions(selectedMonth);

  const {
    data: summaryData,
    isPending: isSummaryPending,
  } = useMonthlySummary(selectedMonth);

  const monthlyTransactions = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  const availableMonths = useMemo(() => getRecentMonthKeys(3), []);

  const handleEdit = (transaction: TransactionItem) => {
    dispatch(openEditTransactionModal({
      id: transaction.id,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      date: transaction.date,
      note: transaction.note,
    }));
  };

  const handleDelete = async (transaction: TransactionItem) => {
    if (confirm(`Are you sure you want to delete this transaction?`)) {
      try {
        await deleteMutation.mutateAsync(transaction.id);
      } catch (error) {
        // Error is handled by mutation hook
        console.error("Failed to delete transaction:", error);
      }
    }
  };

  const handleModalClose = (open: boolean) => {
    if (!open) {
      if (editingTransaction) {
        dispatch(closeEditTransactionModal());
      } else {
        dispatch(closeAddTransactionModal());
      }
    }
  };

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const prefetchNextMonth = usePrefetchNextMonth(selectedMonth);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          prefetchNextMonth();
          fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, prefetchNextMonth]);

  const currentMonthDate = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    return new Date(year, (month ?? 1) - 1, 1);
  }, [selectedMonth]);

  const grouped: GroupedTransactions = useMemo(() => {
    if (!monthlyTransactions || monthlyTransactions.length === 0) return [];

    const groupsMap = new Map<
      string,
      { date: string; dailyTotal: number; transactions: TransactionItem[] }
    >();

    for (const tx of monthlyTransactions) {
      const d = new Date(tx.date);
      const dateKey = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const existing = groupsMap.get(dateKey) ?? {
        date: dateKey,
        dailyTotal: 0,
        transactions: [],
      };

      const signedAmount = tx.type === "income" ? tx.amount : -tx.amount;
      existing.dailyTotal += signedAmount;
      existing.transactions.push(tx);
      groupsMap.set(dateKey, existing);
    }

    const result = Array.from(groupsMap.values());

    // Sort date DESC, and transactions inside each group DESC by time
    result.sort((a, b) => (a.date < b.date ? 1 : -1));
    for (const group of result) {
      group.transactions.sort((a, b) =>
        a.date < b.date ? 1 : -1
      );
    }

    return result;
  }, [monthlyTransactions]);

  const monthlySummary: MonthlySummary = useMemo(() => {
    if (summaryData) return summaryData;

    return {
      month: formatMonthLabel(currentMonthDate),
      totalBefore: 0,
      totalAfter: 0,
      difference: 0,
    };
  }, [summaryData, currentMonthDate]);

  const isTransactionsMutating = useIsMutating({
    mutationKey: ["transactions", "mutation"],
  }) > 0;

  const hasData = monthlyTransactions.length > 0;

  return (
    <ReactQueryErrorBoundary>
      <div className="flex w-full flex-col gap-6 px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <div className="flex items-center gap-2">
            <ErrorBoundaryTestButton />
            <Button onClick={() => dispatch(openAddTransactionModal())}>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="text-lg font-semibold">
            Monthly Overview
          </CardTitle>
          <MonthSelector
            months={availableMonths}
            selectedMonth={selectedMonth}
            onChange={setSelectedMonth}
          />
        </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <>
                <MonthlySummarySkeleton />
                <DailyTransactionsSkeleton />
              </>
            ) : isError ? (
              <p className="text-sm text-destructive">
                Failed to load transactions.
              </p>
            ) : hasData ? (
              <>
                <MonthlySummaryReport
                  summary={monthlySummary}
                  transactions={monthlyTransactions}
                  isUpdating={isTransactionsMutating || isSummaryPending}
                />
                <DailyGroupedTransactions
                  groups={grouped}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
                <div ref={loadMoreRef} />
                {hasNextPage && (
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {isFetchingNextPage ? "Loading more..." : "Load more"}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No transactions for this month.
              </p>
            )}
          </CardContent>
      </Card>
    </div>

    <AddTransactionModal
      open={isAddModalOpen}
      onOpenChange={handleModalClose}
      transaction={editingTransaction}
    />
    </ReactQueryErrorBoundary>
  );
}


