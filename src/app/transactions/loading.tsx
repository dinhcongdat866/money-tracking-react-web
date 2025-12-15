import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="space-y-4 rounded-xl border bg-card p-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

