import { useQuery } from "@tanstack/react-query";
import { getBalance } from "../api/dashboard-api";

export function useBalance() {
  return useQuery({
    queryKey: ["balance"],
    queryFn: getBalance,
  });
}