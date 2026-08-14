"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/src/lib/api-client";
import { qk } from "@/src/core/sync/query-keys";
import type { Project, Workspace } from "@/src/core/sync/types";
import type { MemberRole } from "@/src/core/models/enums";
import { useCan } from "@/src/features/workspace/WorkspaceRoleContext";
import { NavLink, useOptimisticPath } from "@/src/components/NavLink";
import { useUIStore } from "@/src/stores/ui-store";

type WorkspacePayload = {
  workspace: Workspace & { role: MemberRole };
  projects: Project[];
};

type Props = {
  workspaceId: string;
};

export function ProjectNav({ workspaceId }: Props) {
  const path = useOptimisticPath();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  const workspaceQuery = useQuery({
    queryKey: qk.workspace(workspaceId),
    queryFn: () => api.getWorkspace(workspaceId),
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: () => api.createProject(workspaceId, { name }),
    onSuccess: (result) => {
      setName("");
      setOpen(false);
      queryClient.setQueryData<WorkspacePayload>(
        qk.workspace(workspaceId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            projects: [...old.projects, result.project],
          };
        },
      );
      queryClient.setQueryData<{ projects: Project[] }>(
        qk.projects(workspaceId),
        (old) => ({
          projects: [...(old?.projects ?? []), result.project],
        }),
      );
      const href = `/w/${workspaceId}/p/${result.project.id}`;
      useUIStore.getState().setPendingHref(href);
      router.push(href);
    },
  });

  const projects = workspaceQuery.data?.projects ?? [];
  const canWrite = useCan("project.write");
  const inboxHref = `/w/${workspaceId}/inbox`;
  const inboxActive = path.includes("/inbox");
  const activeProjectId = path.includes("/p/")
    ? path.split("/p/")[1]?.split("/")[0]
    : null;

  return (
    <section>
      <div className="flex items-center justify-between px-2 pb-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          Projects
        </p>
        {canWrite ? (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="cursor-pointer text-xs text-ink hover:underline"
          >
            {open ? "Cancel" : "New"}
          </button>
        ) : null}
      </div>
      {open && canWrite ? (
        <form
          className="mb-2 flex gap-2 px-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) return;
            createMutation.mutate();
          }}
        >
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Project name"
            className="h-8 flex-1 border border-dashed border-hairline bg-surface px-2 text-xs text-ink outline-none"
          />
          <button
            type="submit"
            disabled={createMutation.isPending || !name.trim()}
            className="h-8 cursor-pointer bg-ink px-2 text-xs font-semibold text-canvas disabled:opacity-50"
          >
            {createMutation.isPending ? "Saving…" : "Add"}
          </button>
        </form>
      ) : null}
      <ul className="flex flex-col gap-1">
        <li>
          <NavLink
            href={inboxHref}
            className={`block cursor-pointer truncate px-3 py-2 text-sm ${
              inboxActive
                ? "bg-ink text-canvas"
                : "text-muted hover:bg-ink hover:text-canvas"
            }`}
          >
            Inbox
          </NavLink>
        </li>
        {projects.map((project) => {
          const href = `/w/${workspaceId}/p/${project.id}`;
          const active = activeProjectId === project.id;
          return (
            <li key={project.id}>
              <NavLink
                href={href}
                className={`block cursor-pointer truncate px-3 py-2 text-sm ${
                  active
                    ? "bg-ink text-canvas"
                    : "text-muted hover:bg-ink hover:text-canvas"
                }`}
              >
                {project.name}
              </NavLink>
            </li>
          );
        })}
        {workspaceQuery.isLoading && projects.length === 0 ? (
          <li className="px-3 py-2 text-xs text-muted">Loading…</li>
        ) : null}
      </ul>
      {createMutation.isError ? (
        <p className="px-2 pt-2 text-xs text-ink">
          {(createMutation.error as Error).message}
        </p>
      ) : null}
    </section>
  );
}
