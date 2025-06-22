
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RecentTransactionsTable({ transactions }: { transactions: number }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-bold">${transactions.toLocaleString()}</p>
            </CardContent>
        </Card>
    )
}