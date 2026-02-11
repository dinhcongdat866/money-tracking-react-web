import { TransactionDetailPage as TransactionDetailPageClient } from "@/features/transactions/TransactionDetailPage";
import { ReactQueryErrorBoundary } from "@/components/ReactQueryErrorBoundary";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return (
    <ReactQueryErrorBoundary>
      <TransactionDetailPageClient id={id} />
    </ReactQueryErrorBoundary>
  );
}


