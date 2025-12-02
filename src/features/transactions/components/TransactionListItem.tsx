
import Link from "next/link";
import type { TransactionItem } from "../types";

type TransactionListItemProps = {
  transaction: TransactionItem;
};

export function TransactionListItem({ transaction }: TransactionListItemProps) {
  const date = new Date(transaction.date);

  return (
    <Link
      href={`/transactions/${transaction.id}`}
      className="flex items-center justify-between gap-3 py-2"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {transaction.note || transaction.category.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {transaction.category.name} ·{" "}
          {date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
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
  );
}


