"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import {
  Activity,
  Inbox,
  Kanban,
  Search,
  Settings,
  Users,
} from "lucide-react";
import {
  AppShell as UIShell,
  cn,
  type AppNavItem,
} from "@noirly-dev/ui";
import { SignOutButton } from "@/src/features/auth/SignOutButton";
import { CommandPalette } from "@/src/features/command-palette/CommandPalette";
import { CreateTeamWorkspace } from "@/src/features/workspace/CreateTeamWorkspace";
import { useOptimisticPath } from "@/src/components/NavLink";
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

function SidebarBrand() {
  return (
    <div className="flex items-center gap-3.5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] p-1">
        <Image
          src="/logo-dark.png"
          alt=""
          width={40}
          height={40}
          className="h-9 w-9"
          priority
        />
      </div>
      <div>
        <p className="font-display text-sm font-semibold">Noirly Flow</p>
        <p className="text-xs text-[var(--muted-foreground)]">Workspace</p>
      </div>
    </div>
  );
}

function workspaceLinkClass(active: boolean) {
  return cn(
    "flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors",
    active
      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
      : "text-[var(--muted-foreground)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
  );
}

export function AppShell({ user, children }: Props) {
  const path = useOptimisticPath();
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

  const items: AppNavItem[] = [
    {
      href: workspaceId ? `/w/${workspaceId}/inbox` : "/inbox",
      label: "Inbox",
      icon: Inbox,
      match: "prefix",
    },
    {
      href: boardHref,
      label: "Board",
      icon: Kanban,
      match: boardProjectId ? "prefix" : "exact",
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
      match: "prefix",
    },
    ...(workspaceId
      ? [
          {
            href: `/w/${workspaceId}/activity`,
            label: "Activity",
            icon: Activity,
            match: "prefix" as const,
          },
          {
            href: `/w/${workspaceId}/members`,
            label: "Members",
            icon: Users,
            match: "prefix" as const,
          },
        ]
      : []),
  ];

  return (
    <>
      <UIShell
        sidebar={{
          brand: (
            <div className="space-y-4">
              <SidebarBrand />
              <button
                type="button"
                onClick={() => useUIStore.getState().setCommandPaletteOpen(true)}
                className="flex w-full items-center justify-between rounded-xl border border-[var(--hairline)] bg-[var(--surface-2)] px-3 py-2 text-left text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
              >
                <span className="flex items-center gap-2">
                  <Search size={14} />
                  Search
                </span>
                <span className="font-mono text-[10px]">⌘K</span>
              </button>
              <div>
                <p className="px-1 pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  Workspaces
                </p>
                <ul className="flex flex-col gap-0.5">
                  {workspaces.map((workspace) => {
                    const href = `/w/${workspace.id}`;
                    const active = workspaceId === workspace.id;
                    return (
                      <li key={workspace.id}>
                        <Link href={href} className={workspaceLinkClass(active)}>
                          <span className="truncate">{workspace.name}</span>
                          <span className="font-mono text-[10px] uppercase tracking-wide opacity-60">
                            {workspace.kind}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                {workspacesQuery.isLoading && workspaces.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-[var(--muted-foreground)]">
                    Loading…
                  </p>
                ) : null}
                <CreateTeamWorkspace />
              </div>
            </div>
          ),
          items,
          footer: (
            <div className="space-y-3 border-t border-[var(--hairline)] pt-4">
              <div>
                <p className="truncate text-sm">{user.displayName}</p>
                <p className="truncate font-mono text-[11px] text-[var(--muted-foreground)]">
                  {user.email}
                </p>
              </div>
              <SignOutButton />
            </div>
          ),
        }}
        header={{
          brand: (
            <p className="font-display text-sm font-semibold tracking-tight">
              Flow
            </p>
          ),
          actions: (
            <button
              type="button"
              onClick={() => useUIStore.getState().setCommandPaletteOpen(true)}
              className="rounded-lg border border-[var(--hairline)] px-3 py-1.5 font-mono text-sm text-[var(--muted-foreground)]"
            >
              ⌘K
            </button>
          ),
        }}
      >
        {children}
      </UIShell>
      <CommandPalette workspaces={workspaces} />
    </>
  );
}
