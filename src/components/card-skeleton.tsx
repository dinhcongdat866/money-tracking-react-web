import { Skeleton } from "@/components/ui/skeleton";

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <Skeleton className="h-5 w-32" />
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, idx) => (
          <Skeleton key={idx} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

