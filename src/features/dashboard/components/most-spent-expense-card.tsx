
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MostSpentExpenseCard({ mostSpentExpense }: { mostSpentExpense: number }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-bold">${mostSpentExpense.toLocaleString()}</p>
            </CardContent>
        </Card>
    )
}