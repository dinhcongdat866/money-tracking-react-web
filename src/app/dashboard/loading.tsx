import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton } from "@/components/card-skeleton";

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
