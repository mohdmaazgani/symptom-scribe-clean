/**
 * AllProviders wraps children with every provider the application requires
 * during testing. Extend this component whenever a new top-level provider is
 * introduced.
 *
 * Kept in its own file so that `src/test/utils.tsx` (which re-exports
 * non-component helpers from @testing-library/react) does not violate the
 * React fast-refresh rule that requires a file to export *only* components.
 */
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Creates a fresh QueryClient for each test to avoid cross-test cache
 * pollution. Retries and network error logging are disabled to keep test
 * output clean.
 */
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface AllProvidersProps {
  children: React.ReactNode;
  /** Override the initial route for router-dependent tests */
  initialEntries?: string[];
}

function AllProviders({
  children,
  initialEntries = ["/"],
}: AllProvidersProps) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

export default AllProviders;
