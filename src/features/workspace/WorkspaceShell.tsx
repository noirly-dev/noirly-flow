"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { PageContainer } from "@noirly-dev/ui";
import { api } from "@/src/lib/api-client";
import { qk } from "@/src/core/sync/query-keys";
import { ProjectNav } from "@/src/features/workspace/ProjectNav";
import { WorkspaceRoleProvider } from "@/src/features/workspace/WorkspaceRoleContext";

export function WorkspaceShell({
  workspaceId,
  children,
}: {
  workspaceId: string;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const workspaceQuery = useQuery({
    queryKey: qk.workspace(workspaceId),
    queryFn: () => api.getWorkspace(workspaceId),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!workspaceQuery.data) return;
    queryClient.setQueryData(qk.projects(workspaceId), {
      projects: workspaceQuery.data.projects,
    });
  }, [queryClient, workspaceId, workspaceQuery.data]);

  const role = workspaceQuery.data?.workspace.role ?? "member";

  if (workspaceQuery.isError) {
    return (
      <PageContainer size="sm">
        <h1 className="font-display text-3xl font-bold tracking-[-0.04em] uppercase">
          Workspace unavailable
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {(workspaceQuery.error as Error).message ||
            "This workspace could not be loaded."}
        </p>
      </PageContainer>
    );
  }

  return (
    <WorkspaceRoleProvider role={role}>
      <div className="flex min-w-0 flex-1 flex-col lg:flex-row">
        <div className="border-b border-[var(--hairline)] p-3 lg:sticky lg:top-0 lg:flex lg:h-full lg:w-52 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
          <ProjectNav workspaceId={workspaceId} />
        </div>
        <div className="min-h-0 min-w-0 flex-1">{children}</div>
      </div>
    </WorkspaceRoleProvider>
  );
}
