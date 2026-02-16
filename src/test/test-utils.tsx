import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import { ReactElement, ReactNode } from "react";
import { vi, expect } from "vitest";

/**
 * Creates a fresh QueryClient for testing
 * 
 * @param options - Optional QueryClient configuration
 * @returns A new QueryClient instance for testing
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Turn off retries for tests - faster and more predictable
        retry: false,
        // Prevent background refetches during tests
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        // Don't cache between tests
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface TestWrapperProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

/**
 * Test wrapper that provides React Query context
 */
export function TestWrapper({
  children,
  queryClient,
}: TestWrapperProps) {
  const client = queryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * Custom render function that wraps components with React Query provider
 * 
 * @example
 * ```tsx
 * const { result } = renderWithClient(<MyComponent />);
 * ```
 */
export function renderWithClient(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & { queryClient?: QueryClient },
) {
  const { queryClient, ...renderOptions } = options || {};

  return render(ui, {
    wrapper: ({ children }) => (
      <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
    ),
    ...renderOptions,
  });
}

/**
 * Wait for a query to finish loading
 * 
 * @example
 * ```tsx
 * await waitForQueryToFinish(queryClient, transactionKeys.detail('123'));
 * ```
 */
export async function waitForQueryToFinish(
  queryClient: QueryClient,
  queryKey: unknown[],
) {
  await vi.waitFor(() => {
    const state = queryClient.getQueryState(queryKey);
    expect(state?.status).not.toBe("pending");
  });
}

/**
 * Wait for a mutation to finish
 */
export async function waitForMutationToFinish(
  queryClient: QueryClient,
  mutationKey: unknown[],
) {
  await vi.waitFor(() => {
    const mutations = queryClient
      .getMutationCache()
      .findAll({ mutationKey });
    const hasRunningMutation = mutations.some((m) => m.state.status === "pending");
    expect(hasRunningMutation).toBe(false);
  });
}

/**
 * Mock fetch for testing API calls
 * 
 * @example
 * ```tsx
 * mockFetch({ data: { id: '123', amount: 100 } });
 * ```
 */
export function mockFetch(response: {
  data?: unknown;
  error?: string;
  status?: number;
}) {
  const { data, error, status = error ? 400 : 200 } = response;

  const headers = new Headers();
  headers.set('content-type', 'application/json');

  const mockResponse = {
    ok: status >= 200 && status < 300,
    status,
    json: async () => (error ? { error } : data),
    headers,
    redirected: false,
    statusText: status >= 200 && status < 300 ? "OK" : "Error",
    type: "basic" as ResponseType,
    url: "",
    clone: function() { return this; },
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    text: async () => JSON.stringify(error ? { error } : data),
  };

  global.fetch = vi.fn().mockResolvedValue(mockResponse);
}

/**
 * Clear all mocks and reset query client
 */
export function cleanupTests(queryClient: QueryClient) {
  queryClient.clear();
  vi.clearAllMocks();
}

