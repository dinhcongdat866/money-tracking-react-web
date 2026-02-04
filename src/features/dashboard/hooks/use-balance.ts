import { useQuery } from "@tanstack/react-query";
import { getBalance } from "../api/dashboard-api";
import { type Balance } from "../types";
import { financialKeys } from "@/lib/query-keys";
import type { BaseQueryOptions, QueryKeyOf } from "@/lib/react-query-types";
import type { ApiError } from "@/lib/api-errors";

export type UseBalanceOptions = BaseQueryOptions<
  Balance,
  QueryKeyOf<typeof financialKeys.balance>
>;

export function useBalance(options?: UseBalanceOptions) {
  return useQuery<Balance, ApiError, Balance, QueryKeyOf<typeof financialKeys.balance>>({
    queryKey: financialKeys.balance(),
    queryFn: getBalance,
    ...options,
  });
}