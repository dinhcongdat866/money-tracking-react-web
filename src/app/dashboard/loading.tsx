import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="p-6 space-y-6">
      <Skeleton className="h-8 w-40" />

      <section>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CardSkeleton lines={3} />
        <CardSkeleton lines={3} />
      </section>

      <section>
        <CardSkeleton lines={4} />
      </section>
    </main>
  );
}

function CardSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <Skeleton className="mb-3 h-5 w-32" />
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, idx) => (
          <Skeleton key={idx} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

