"use client";

import { useQuery } from "@tanstack/react-query";
import { PageContainer, PageHeader } from "@noirly-dev/ui";
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
    <PageContainer size="md">
      <PageHeader kicker="Audit" title={`${name} activity`} />
      <WorkspaceActivityPanel workspaceId={workspaceId} workspaceName={name} />
    </PageContainer>
  );
}
