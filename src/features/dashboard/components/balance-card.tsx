"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBalance } from "../hooks/use-balance";

export function BalanceCard() {
    const { data, isLoading, isError } = useBalance();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                ) : isError ? (
                    <p className="text-destructive">Error loading balance</p>
                ) : (
                    <p className="text-3xl font-bold">
                        {data?.currency} {data?.amount.toLocaleString()}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}