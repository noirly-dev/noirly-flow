"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { FlowRealtimeProvider } from "@/src/features/realtime/FlowRealtimeProvider";
import { SavingIndicator } from "@/src/components/SavingIndicator";

export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <FlowRealtimeProvider>
        <div className="flex min-h-dvh flex-1 flex-col">{children}</div>
        <SavingIndicator />
      </FlowRealtimeProvider>
    </QueryClientProvider>
  );
}
