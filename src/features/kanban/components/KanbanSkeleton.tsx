/**
 * Loading skeleton for Kanban board
 */
export function KanbanSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Filters skeleton */}
      <div className="bg-gray-200 h-24 rounded-lg" />

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-200 h-20 rounded-lg" />
        ))}
      </div>

      {/* Kanban columns skeleton */}
      <div className="overflow-x-auto pb-4">
        <div className="inline-flex gap-4 min-h-[600px]">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="w-[320px] flex-shrink-0">
              {/* Column header */}
              <div className="bg-gray-200 h-32 rounded-t-lg mb-2" />
              {/* Column content */}
              <div className="bg-gray-100 h-[500px] rounded-b-lg p-2 space-y-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="bg-gray-200 h-24 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
