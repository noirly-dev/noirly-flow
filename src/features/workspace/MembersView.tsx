"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api-client";
import { qk } from "@/src/core/sync/query-keys";
import { useCan } from "@/src/features/workspace/WorkspaceRoleContext";
import { MembersPanel } from "@/src/features/workspace/MembersPanel";

export function MembersView({ workspaceId }: { workspaceId: string }) {
  const workspaceQuery = useQuery({
    queryKey: qk.workspace(workspaceId),
    queryFn: () => api.getWorkspace(workspaceId),
    staleTime: 60_000,
  });
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => api.me(),
    staleTime: 60_000,
  });
  const canManage = useCan("members.manage");
  const name = workspaceQuery.data?.workspace.name ?? "Workspace";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <div>
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--muted-foreground)]">
          Team
        </p>
        <h1 className="mt-2 font-display text-5xl font-semibold tracking-tight">
          {name} members
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Roles: owner, admin, member, viewer. Viewers cannot edit tasks.
        </p>
      </div>
      {meQuery.data ? (
        <MembersPanel
          workspaceId={workspaceId}
          currentUserId={meQuery.data.user.id}
          canManage={canManage}
        />
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">Loading members…</p>
      )}
    </main>
  );
}
