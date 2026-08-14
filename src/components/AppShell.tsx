"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { SignOutButton } from "@/src/features/auth/SignOutButton";
import { CommandPalette } from "@/src/features/command-palette/CommandPalette";
import { CreateTeamWorkspace } from "@/src/features/workspace/CreateTeamWorkspace";
import { NavLink, useOptimisticPath } from "@/src/components/NavLink";
import { api } from "@/src/lib/api-client";
import { qk } from "@/src/core/sync/query-keys";
import { useUIStore, readLastWorkspaceId } from "@/src/stores/ui-store";

export type ShellUser = {
  displayName: string;
  email: string;
};

type Props = {
  user: ShellUser;
  children: ReactNode;
};

function navClass(active: boolean) {
  return `block cursor-pointer px-3 py-2 text-sm ${
    active
      ? "bg-ink text-canvas"
      : "text-muted hover:bg-ink hover:text-canvas"
  }`;
}

export function AppShell({ user, children }: Props) {
  const path = useOptimisticPath();
  const [open, setOpen] = useState(false);
  const lastWorkspaceId = useUIStore((state) => state.lastWorkspaceId);
  const setLastWorkspaceId = useUIStore((state) => state.setLastWorkspaceId);
  const workspacesQuery = useQuery({
    queryKey: qk.workspaces,
    queryFn: () => api.listWorkspaces(),
    staleTime: 60_000,
  });
  const workspaces = workspacesQuery.data?.workspaces ?? [];

  const pathWorkspaceId = path.startsWith("/w/") ? path.split("/")[2] : null;
  const workspaceId =
    pathWorkspaceId ?? lastWorkspaceId ?? workspaces[0]?.id ?? null;

  useEffect(() => {
    if (pathWorkspaceId) {
      setLastWorkspaceId(pathWorkspaceId);
      return;
    }
    if (!lastWorkspaceId) {
      const stored = readLastWorkspaceId();
      if (stored) setLastWorkspaceId(stored);
    }
  }, [pathWorkspaceId, lastWorkspaceId, setLastWorkspaceId]);

  const isInbox = path.includes("/inbox");
  const isMembers = path.includes("/members");
  const isActivity = path.includes("/activity");
  const isSettings = path.startsWith("/settings");
  const isBoard =
    Boolean(pathWorkspaceId) && !isInbox && !isMembers && !isActivity;
  const currentProjectId = path.includes("/p/")
    ? path.split("/p/")[1]?.split("/")[0]
    : null;

  const workspaceDetailQuery = useQuery({
    queryKey: qk.workspace(workspaceId ?? ""),
    queryFn: () => api.getWorkspace(workspaceId!),
    enabled: Boolean(workspaceId),
    staleTime: 60_000,
  });
  const boardProjectId =
    currentProjectId ?? workspaceDetailQuery.data?.projects[0]?.id;
  const boardHref = workspaceId
    ? boardProjectId
      ? `/w/${workspaceId}/p/${boardProjectId}`
      : `/w/${workspaceId}`
    : "/";

  return (
    <div className="flex min-h-dvh">
      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-ink/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-64 flex-col border-r border-dashed border-hairline bg-canvas transition-transform md:sticky md:top-0 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="border-b border-dashed border-hairline px-5 py-5">
          <p className="font-display text-lg font-bold tracking-[-0.04em] uppercase">
            Noirly Flow
          </p>
          <button
            type="button"
            onClick={() =>
              useUIStore.getState().setCommandPaletteOpen(true)
            }
            className="mt-3 flex w-full cursor-pointer items-center justify-between border border-dashed border-hairline px-3 py-2 text-left text-sm text-muted hover:bg-ink hover:text-canvas"
          >
            <span>Search</span>
            <span className="font-mono text-[10px]">⌘K</span>
          </button>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
          <section>
            <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              Workspace
            </p>
            <ul className="flex flex-col gap-px">
              {workspaces.map((workspace) => {
                const href = `/w/${workspace.id}`;
                const active = workspaceId === workspace.id;
                return (
                  <li key={workspace.id}>
                    <NavLink
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm ${
                        active
                          ? "bg-ink text-canvas"
                          : "text-muted hover:bg-ink hover:text-canvas"
                      }`}
                    >
                      <span className="truncate">{workspace.name}</span>
                      <span className="font-mono text-[10px] uppercase tracking-wide opacity-60">
                        {workspace.kind}
                      </span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
            {workspacesQuery.isLoading && workspaces.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted">Loading…</p>
            ) : null}
            <CreateTeamWorkspace />
          </section>

          <section>
            <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              Navigate
            </p>
            <ul className="flex flex-col gap-px">
              <li>
                <NavLink
                  href={
                    workspaceId ? `/w/${workspaceId}/inbox` : "/inbox"
                  }
                  onClick={() => setOpen(false)}
                  className={navClass(isInbox)}
                >
                  Inbox
                </NavLink>
              </li>
              <li>
                <NavLink
                  href={boardHref}
                  onClick={() => setOpen(false)}
                  className={navClass(isBoard)}
                >
                  Board
                </NavLink>
              </li>
              <li>
                <NavLink
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className={navClass(isSettings)}
                >
                  Settings
                </NavLink>
              </li>
              {workspaceId ? (
                <li>
                  <NavLink
                    href={`/w/${workspaceId}/activity`}
                    onClick={() => setOpen(false)}
                    className={navClass(isActivity)}
                  >
                    Activity
                  </NavLink>
                </li>
              ) : null}
              {workspaceId ? (
                <li>
                  <NavLink
                    href={`/w/${workspaceId}/members`}
                    onClick={() => setOpen(false)}
                    className={navClass(isMembers)}
                  >
                    Members
                  </NavLink>
                </li>
              ) : null}
            </ul>
          </section>
        </nav>

        <div className="mt-auto shrink-0 border-t border-dashed border-hairline px-4 py-4">
          <p className="truncate text-sm">{user.displayName}</p>
          <p className="truncate font-mono text-[11px] text-muted">{user.email}</p>
          <div className="mt-3">
            <SignOutButton />
          </div>
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-dashed border-hairline px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="cursor-pointer border border-dashed border-hairline px-3 py-1.5 text-sm"
          >
            Menu
          </button>
          <p className="font-display text-sm font-bold tracking-[-0.04em] uppercase">
            Flow
          </p>
          <button
            type="button"
            onClick={() =>
              useUIStore.getState().setCommandPaletteOpen(true)
            }
            className="ml-auto cursor-pointer border border-dashed border-hairline px-3 py-1.5 font-mono text-sm text-muted"
          >
            ⌘K
          </button>
        </header>
        <div className="min-h-0 min-w-0 flex-1">{children}</div>
      </div>
      <CommandPalette workspaces={workspaces} />
    </div>
  );
}
