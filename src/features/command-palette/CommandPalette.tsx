"use client";

import { Command } from "cmdk";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/src/lib/api-client";
import { qk } from "@/src/core/sync/query-keys";
import { useUIStore } from "@/src/stores/ui-store";
import type { Workspace } from "@/src/core/sync/types";
import { can } from "@/src/core/permissions/can";

const itemClass =
  "flex cursor-pointer items-center justify-between px-3 py-2 text-sm text-ink data-[selected=true]:bg-ink data-[selected=true]:text-canvas";
const headingClass =
  "mb-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.16em] [&_[cmdk-group-heading]]:text-muted";

type Props = {
  workspaces: Workspace[];
};

export function CommandPalette({ workspaces }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const open = useUIStore((state) => state.commandPaletteOpen);
  const setOpen = useUIStore((state) => state.setCommandPaletteOpen);
  const toggle = useUIStore((state) => state.toggleCommandPalette);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activeWorkspaceId = pathname.startsWith("/w/")
    ? pathname.split("/")[2]
    : workspaces[0]?.id;
  const onInbox = pathname.includes("/inbox");
  const activeProjectId = pathname.includes("/p/")
    ? pathname.split("/p/")[1]?.split("/")[0]
    : undefined;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        toggle();
        return;
      }

      const target = event.target as HTMLElement | null;
      const inField =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (
        !inField &&
        event.key.toLowerCase() === "c" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
        setOpen(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setOpen, toggle]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebounced("");
      setError(null);
    }
  }, [open]);

  const workspaceQuery = useQuery({
    queryKey: activeWorkspaceId
      ? qk.workspace(activeWorkspaceId)
      : ["workspaces", "none"],
    queryFn: () => api.getWorkspace(activeWorkspaceId!),
    enabled: open && Boolean(activeWorkspaceId),
  });
  const canWrite = can(
    workspaceQuery.data?.workspace.role ?? "member",
    "task.write",
  );

  const searchQuery = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => api.search(debounced),
    enabled: open && debounced.length >= 2,
  });

  const createTitle = query.trim();
  const workspaceName = useMemo(
    () =>
      workspaces.find((workspace) => workspace.id === activeWorkspaceId)?.name ??
      "workspace",
    [workspaces, activeWorkspaceId],
  );

  async function createTask(title: string) {
    if (!activeWorkspaceId || !title || !canWrite) return;
    try {
      const { projects } = workspaceQuery.data ?? (await api.getWorkspace(activeWorkspaceId));
      const projectId = onInbox
        ? null
        : activeProjectId || projects[0]?.id || null;
      await api.createTask(activeWorkspaceId, {
        title,
        projectId,
      });
      await queryClient.invalidateQueries({
        queryKey: ["tasks", activeWorkspaceId],
      });
      setOpen(false);
      router.push(
        projectId
          ? `/w/${activeWorkspaceId}/p/${projectId}`
          : `/w/${activeWorkspaceId}/inbox`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create task");
    }
  }

  async function createProject(name: string) {
    if (!activeWorkspaceId || !name || !canWrite) return;
    try {
      const { project } = await api.createProject(activeWorkspaceId, { name });
      await queryClient.invalidateQueries({
        queryKey: qk.projects(activeWorkspaceId),
      });
      setOpen(false);
      router.push(`/w/${activeWorkspaceId}/p/${project.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create project");
    }
  }

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      overlayClassName="fixed inset-0 z-50 bg-ink/50"
      contentClassName="fixed left-1/2 top-[12vh] z-50 w-[min(36rem,calc(100%-2rem))] -translate-x-1/2 overflow-hidden border border-dashed border-hairline bg-surface"
    >
      <Command.Input
        value={query}
        onValueChange={setQuery}
        placeholder="Create a task, search, or jump…"
        className="h-12 w-full border-b border-dashed border-hairline bg-transparent px-4 text-sm text-ink outline-none placeholder:text-muted"
      />
      <Command.List className="max-h-80 overflow-y-auto p-2">
        <Command.Empty className="px-3 py-6 text-center text-sm text-muted">
          No results.
        </Command.Empty>

        {createTitle && canWrite ? (
          <Command.Group heading="Actions" className={headingClass}>
            <Command.Item
              value={`create-task ${createTitle}`}
              onSelect={() => void createTask(createTitle)}
              className={itemClass}
            >
              <span>Create task “{createTitle}”</span>
              <span className="font-mono text-[10px] uppercase tracking-wide text-muted">
                {workspaceName}
              </span>
            </Command.Item>
            <Command.Item
              value={`create-project ${createTitle}`}
              onSelect={() => void createProject(createTitle)}
              className={itemClass}
            >
              <span>Create project “{createTitle}”</span>
              <span className="font-mono text-[10px] uppercase tracking-wide text-muted">
                {workspaceName}
              </span>
            </Command.Item>
          </Command.Group>
        ) : null}

        <Command.Group heading="Navigate" className={headingClass}>
          {activeWorkspaceId ? (
            <Command.Item
              value="inbox unfiled tasks"
              onSelect={() => go(`/w/${activeWorkspaceId}/inbox`)}
              className={itemClass}
            >
              Inbox
            </Command.Item>
          ) : null}
          {activeWorkspaceId ? (
            <Command.Item
              value="activity audit log"
              onSelect={() => go(`/w/${activeWorkspaceId}/activity`)}
              className={itemClass}
            >
              Activity
            </Command.Item>
          ) : null}
          {workspaces.map((workspace) => (
            <Command.Item
              key={workspace.id}
              value={`workspace ${workspace.name} ${workspace.slug}`}
              onSelect={() => go(`/w/${workspace.id}`)}
              className={itemClass}
            >
              <span>{workspace.name}</span>
              <span className="font-mono text-[10px] uppercase tracking-wide text-muted">
                {workspace.kind}
              </span>
            </Command.Item>
          ))}
          <Command.Item
            value="settings account"
            onSelect={() => go("/settings")}
            className={itemClass}
          >
            Settings
          </Command.Item>
        </Command.Group>

        {searchQuery.data?.tasks.length ? (
          <Command.Group heading="Tasks" className={headingClass}>
            {searchQuery.data.tasks.map((task) => (
              <Command.Item
                key={task.id}
                value={`task ${task.title}`}
                onSelect={() =>
                  go(
                    task.projectId
                      ? `/w/${task.workspaceId}/p/${task.projectId}?task=${task.id}`
                      : `/w/${task.workspaceId}/inbox?task=${task.id}`,
                  )
                }
                className={itemClass}
              >
                <span className="truncate">{task.title}</span>
                <span className="font-mono text-[10px] uppercase tracking-wide text-muted">
                  {task.status.replaceAll("_", " ")}
                </span>
              </Command.Item>
            ))}
          </Command.Group>
        ) : null}
      </Command.List>
      {error ? (
        <p className="border-t border-dashed border-hairline px-4 py-2 text-xs text-ink">
          {error}
        </p>
      ) : (
        <p className="border-t border-dashed border-hairline px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-muted">
          Esc to close · Enter to run
        </p>
      )}
    </Command.Dialog>
  );
}
