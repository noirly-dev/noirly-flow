"use client";

import { RealtimeClient } from "@noirly-dev/realtime-client";
import { RealtimeProvider } from "@noirly-dev/realtime-client/react";
import { useMemo, type ReactNode } from "react";

type Scope = { workspaceId: string | null; projectId: string | null };

const scope: Scope = { workspaceId: null, projectId: null };

export function setRealtimeScope(workspaceId: string, projectId: string | null): void {
  scope.workspaceId = workspaceId;
  scope.projectId = projectId;
}

async function fetchRealtimeToken(): Promise<string> {
  if (!scope.workspaceId) {
    throw new Error("realtime scope not set");
  }
  const params = new URLSearchParams({ workspaceId: scope.workspaceId });
  if (scope.projectId) params.set("projectId", scope.projectId);
  const res = await fetch(`/api/realtime/token?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to mint realtime token");
  }
  const json = (await res.json()) as { token: string };
  return json.token;
}

export function FlowRealtimeProvider({ children }: { children: ReactNode }) {
  const url = process.env.NEXT_PUBLIC_REALTIME_WS_URL;
  const client = useMemo(() => {
    if (!url) return null;
    return new RealtimeClient({
      url,
      getToken: fetchRealtimeToken,
    });
  }, [url]);

  if (!client) return children;

  return (
    <RealtimeProvider client={client} autoConnect={false}>
      {children}
    </RealtimeProvider>
  );
}
