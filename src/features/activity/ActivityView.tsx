"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api-client";
import { qk } from "@/src/core/sync/query-keys";
import { WorkspaceActivityPanel } from "@/src/features/activity/WorkspaceActivityPanel";

export function ActivityView({ workspaceId }: { workspaceId: string }) {
  const workspaceQuery = useQuery({
    queryKey: qk.workspace(workspaceId),
    queryFn: () => api.getWorkspace(workspaceId),
    staleTime: 60_000,
  });
  const name = workspaceQuery.data?.workspace.name ?? "Workspace";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <div>
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--muted-foreground)]">
          Audit
        </p>
        <h1 className="mt-2 font-display text-5xl font-semibold tracking-tight">
          {name} activity
        </h1>
      </div>
      <WorkspaceActivityPanel workspaceId={workspaceId} workspaceName={name} />
    </main>
  );
}
