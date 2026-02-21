import { Suspense } from 'react';
import { KanbanBoard } from '@/features/kanban/components/KanbanBoard';
import { KanbanSkeleton } from '@/features/kanban/components/KanbanSkeleton';

export const metadata = {
  title: 'Kanban Board - Money Tracker',
  description: 'Drag and drop transactions between categories',
};

export default function KanbanPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Transaction Kanban</h1>
        <p className="text-muted-foreground">
          Organize your transactions by dragging them between categories
        </p>
      </div>

      <Suspense fallback={<KanbanSkeleton />}>
        <KanbanBoard />
      </Suspense>
    </div>
  );
}
