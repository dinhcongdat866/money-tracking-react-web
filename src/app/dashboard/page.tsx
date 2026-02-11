import { BalanceCard } from "@/features/dashboard/components/balance-card";
import { SummaryCard } from "@/features/dashboard/components/summary-card";
import { MostSpentExpensesCard } from "@/features/dashboard/components/most-spent-expense-card";
import RecentTransactionsTable from "@/features/dashboard/components/recent-transactions-table";
import { ReactQueryErrorBoundary } from "@/components/ReactQueryErrorBoundary";
import { ErrorBoundaryTestButton } from "@/components/ErrorBoundaryTestButton";

export default function DashboardPage() {
  return (
    <main className="p-6 space-y-6">
      <ReactQueryErrorBoundary>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <ErrorBoundaryTestButton />
          </div>
          <BalanceCard />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SummaryCard />
            <MostSpentExpensesCard limit={3} />
          </div>

          <RecentTransactionsTable />
        </div>
      </ReactQueryErrorBoundary>
    </main>
  );
}