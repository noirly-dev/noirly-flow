"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/src/lib/api-client";
import { qk } from "@/src/core/sync/query-keys";
import { useCan } from "@/src/features/workspace/WorkspaceRoleContext";

type Props = {
  workspaceId: string;
};

export function ProjectNav({ workspaceId }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  const projectsQuery = useQuery({
    queryKey: qk.projects(workspaceId),
    queryFn: () => api.listProjects(workspaceId),
  });

  const createMutation = useMutation({
    mutationFn: () => api.createProject(workspaceId, { name }),
    onSuccess: (result) => {
      setName("");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: qk.projects(workspaceId) });
      router.push(`/w/${workspaceId}/p/${result.project.id}`);
      router.refresh();
    },
  });

  const projects = projectsQuery.data?.projects ?? [];
  const canWrite = useCan("project.write");
  const inboxHref = `/w/${workspaceId}/inbox`;
  const inboxActive = pathname.includes("/inbox");
  const activeProjectId = pathname.includes("/p/")
    ? pathname.split("/p/")[1]?.split("/")[0]
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
            className="text-xs text-ink hover:underline"
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
            className="h-8 bg-ink px-2 text-xs font-semibold text-canvas disabled:opacity-50"
          >
            Add
          </button>
        </form>
      ) : null}
      <ul className="flex flex-col gap-1">
        <li>
          <Link
            href={inboxHref}
            className={`block truncate px-3 py-2 text-sm ${
              inboxActive
                ? "bg-ink text-canvas"
                : "text-muted hover:bg-ink hover:text-canvas"
            }`}
          >
            Inbox
          </Link>
        </li>
        {projects.map((project) => {
          const href = `/w/${workspaceId}/p/${project.id}`;
          const active = activeProjectId === project.id;
          return (
            <li key={project.id}>
              <Link
                href={href}
                className={`block truncate px-3 py-2 text-sm ${
                  active
                    ? "bg-ink text-canvas"
                    : "text-muted hover:bg-ink hover:text-canvas"
                }`}
              >
                {project.name}
              </Link>
            </li>
          );
        })}
        {projectsQuery.isLoading ? (
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
