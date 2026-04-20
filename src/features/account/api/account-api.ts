import { apiRequest } from "@/lib/api-client";
import type { AccountProfile, AccountProfilePatch } from "../types";

export async function fetchAccountProfile(): Promise<AccountProfile> {
  return apiRequest<AccountProfile>("/api/account/profile", {
    cache: "no-store",
  });
}

export async function updateAccountProfile(
  patch: AccountProfilePatch,
): Promise<AccountProfile> {
  return apiRequest<AccountProfile>("/api/account/profile", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}
