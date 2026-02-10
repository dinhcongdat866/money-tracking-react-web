import { useQueryClient } from "@tanstack/react-query";
import { transactionKeys } from "@/lib/query-keys";
import { getTransactionDetail } from "../api/transactions-api";
import { useDebouncedCallback } from "@/lib/useDebouncedCallback";

export function usePrefetchTransactionDetail(delay: number = 150) {
  const queryClient = useQueryClient();

  return useDebouncedCallback(
    (id: string | undefined) => {
      if (!id) return;
      const key = transactionKeys.detail(id);
      if (queryClient.getQueryData(key)) return;

      void queryClient.prefetchQuery({
        queryKey: key,
        queryFn: () => getTransactionDetail(id),
      });
    },
    delay,
  );
}

