"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function MonthlySummarySkeleton() {
  return (
    <section className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    </section>
  );
}


