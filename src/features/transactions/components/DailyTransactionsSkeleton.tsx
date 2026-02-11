"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function DailyTransactionsSkeleton({ days = 3 }: { days?: number }) {
  return (
    <section className="space-y-4">
      {Array.from({ length: days }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-lg border bg-card p-4 space-y-3"
        >
          <div className="flex items-baseline justify-between gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 3 }).map((__, txIdx) => (
              <div key={txIdx} className="py-2 flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}


