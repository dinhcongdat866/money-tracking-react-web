'use client';

/**
 * Virtual Loading Row Component
 * 
 * Displays at the bottom of virtualized list during background fetches.
 * Provides visual feedback for infinite scroll without disrupting the user.
 * 
 * Interview Points:
 * - Positioned as a virtual item in the list
 * - Skeleton loading pattern (better UX than spinners)
 * - Minimal height to avoid layout shift
 */

type LoadingRowProps = {
  isLoading: boolean;
};

export function LoadingRow({ isLoading }: LoadingRowProps) {
  if (!isLoading) return null;

  return (
    <div className="px-3 py-2">
      <div className="bg-card border rounded-lg p-4 animate-pulse">
        {/* Amount skeleton */}
        <div className="h-6 bg-muted rounded w-24 mb-3" />
        
        {/* Note skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
        
        {/* Date skeleton */}
        <div className="h-3 bg-muted rounded w-20 mt-3" />
      </div>
    </div>
  );
}

/**
 * End of List Indicator
 * 
 * Shows when all data has been loaded.
 * Prevents confusion about whether more data is available.
 */
export function EndOfListIndicator() {
  return (
    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
      <div className="border-t pt-4">
        All items loaded
      </div>
    </div>
  );
}
