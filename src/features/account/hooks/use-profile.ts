import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAccountProfile, updateAccountProfile } from "../api/account-api";
import type { AccountProfile, AccountProfilePatch } from "../types";
import { accountKeys, STALE_TIME } from "@/lib/query-keys";
import type { BaseQueryOptions, QueryKeyOf } from "@/lib/react-query-types";
import type { ApiError } from "@/lib/api-errors";

export type UseAccountProfileOptions = BaseQueryOptions<
  AccountProfile,
  QueryKeyOf<typeof accountKeys.profile>
>;

export function useAccountProfile(options?: UseAccountProfileOptions) {
  return useQuery<
    AccountProfile,
    ApiError,
    AccountProfile,
    QueryKeyOf<typeof accountKeys.profile>
  >({
    queryKey: accountKeys.profile(),
    queryFn: fetchAccountProfile,
    staleTime: STALE_TIME.MEDIUM,
    ...options,
  });
}

export function useUpdateAccountProfile() {
  const queryClient = useQueryClient();
  return useMutation<AccountProfile, ApiError, AccountProfilePatch>({
    mutationFn: updateAccountProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.profile() });
    },
  });
}
