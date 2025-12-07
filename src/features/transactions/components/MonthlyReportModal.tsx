"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ExpenseByCategory } from "./ExpenseByCategory";
import type { MonthlySummary, TransactionItem } from "../types";

type MonthlyReportModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: MonthlySummary;
  transactions: TransactionItem[];
};

export function MonthlyReportModal({
  open,
  onOpenChange,
  summary,
  transactions,
}: MonthlyReportModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogClose onClose={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>Monthly Report - {summary.month}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* First Balance, Last Balance, and Net Change */}
          <div className="grid grid-cols-3 gap-4 rounded-lg border bg-card p-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">First Balance</p>
              <p className="text-xl font-semibold">
                ${summary.totalBefore.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Last Balance</p>
              <p className="text-xl font-semibold">
                ${summary.totalAfter.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Net Change</p>
              <p
                className={`text-xl font-semibold ${
                  summary.difference >= 0 ? "text-emerald-500" : "text-rose-500"
                }`}
              >
                {summary.difference >= 0 ? "+" : "-"}$
                {Math.abs(summary.difference).toLocaleString()}
              </p>
            </div>
          </div>

          <ExpenseByCategory transactions={transactions} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

