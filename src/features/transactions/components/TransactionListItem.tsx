"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TransactionItem } from "../types";

type TransactionListItemProps = {
  transaction: TransactionItem;
  showFullDateTime?: boolean;
  onEdit?: (transaction: TransactionItem) => void;
  onDelete?: (transaction: TransactionItem) => void;
};

export function TransactionListItem({
  transaction,
  showFullDateTime = false,
  onEdit,
  onDelete,
}: TransactionListItemProps) {
  const date = new Date(transaction.date);

  const dateTimeDisplay = showFullDateTime
    ? date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.(transaction);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(transaction);
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2 group">
      <Link
        href={`/transactions/${transaction.id}`}
        className="flex items-center justify-between gap-3 flex-1 min-w-0"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {transaction.note || transaction.category.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {transaction.category.name} · {dateTimeDisplay}
          </p>
        </div>
        <span
          className={`text-sm font-semibold ${
            transaction.type === "income" ? "text-emerald-500" : "text-rose-500"
          }`}
        >
          {transaction.type === "expense" ? "-" : "+"}$
          {transaction.amount.toLocaleString()}
        </span>
      </Link>
      {(onEdit || onDelete) && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleEdit}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}


