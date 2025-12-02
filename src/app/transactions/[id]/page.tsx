import { TransactionDetailPage as TransactionDetailPageClient } from "@/features/transactions/TransactionDetailPage";

type PageProps = {
  params: { id: string };
};

export default function Page({ params }: PageProps) {
  return <TransactionDetailPageClient id={params.id} />;
}


