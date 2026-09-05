"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { DEFAULT_THEME_ID } from "@noirly-dev/ui";
import { ThemeProvider } from "@/src/components/ThemeProvider";
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
    <ThemeProvider defaultThemeId={DEFAULT_THEME_ID}>
      <QueryClientProvider client={client}>
        <FlowRealtimeProvider>
          <div className="flex min-h-dvh flex-1 flex-col">{children}</div>
          <SavingIndicator />
        </FlowRealtimeProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
