"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export default function QueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Financial data: always refetch from server, no caching
                        staleTime: 0, // Always consider data stale, refetch immediately
                        gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes for navigation
                        refetchOnWindowFocus: true, // Refetch when user returns to tab
                        refetchOnReconnect: true, // Refetch when network reconnects
                        retry: 1,
                        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
                    },
                    mutations: {
                        retry: 1,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}