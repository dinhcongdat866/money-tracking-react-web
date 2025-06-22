import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SummaryCard({ summary }: { summary: number }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-bold">${summary.toLocaleString()}</p>
            </CardContent>
        </Card>
    )
}