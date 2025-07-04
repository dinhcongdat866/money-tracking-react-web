import { BalanceCard } from "@/features/dashboard/components/balance-card";
import { SummaryCard } from "@/features/dashboard/components/summary-card";
import { MostSpentExpensesCard } from "@/features/dashboard/components/most-spent-expense-card";
import RecentTransactionsTable from "@/features/dashboard/components/recent-transactions-table";

export default function DashboardPage() {
    return (
        <main className="p-6 space-y-6">
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <BalanceCard />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SummaryCard />
                <MostSpentExpensesCard limit={3} />
            </div>

            <RecentTransactionsTable transactions={1000000} />
        </main>
    );
}