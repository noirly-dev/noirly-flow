"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/src/lib/api-client";
import { qk } from "@/src/core/sync/query-keys";

export function FirstProjectRedirect({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const workspaceQuery = useQuery({
    queryKey: qk.workspace(workspaceId),
    queryFn: () => api.getWorkspace(workspaceId),
    staleTime: 60_000,
  });

  const firstProject = workspaceQuery.data?.projects[0];

  useEffect(() => {
    if (!firstProject) return;
    router.replace(`/w/${workspaceId}/p/${firstProject.id}`);
  }, [firstProject, router, workspaceId]);

  if (workspaceQuery.isSuccess && workspaceQuery.data.projects.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-col gap-3 px-6 py-16">
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted">
          Workspace
        </p>
        <h1 className="text-perforated mt-2 font-display text-5xl font-bold tracking-[-0.05em] uppercase">
          No projects yet
        </h1>
        <p className="text-sm text-muted">
          Create a project in the sidebar to start a board.
        </p>
      </main>
    );
  }

  return (
    <main className="px-6 py-10">
      <p className="text-sm text-muted">Opening board…</p>
    </main>
  );
}
