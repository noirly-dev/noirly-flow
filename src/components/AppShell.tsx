"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { SignOutButton } from "@/src/features/auth/SignOutButton";
import { CommandPalette } from "@/src/features/command-palette/CommandPalette";
import { CreateTeamWorkspace } from "@/src/features/workspace/CreateTeamWorkspace";
import { useUIStore } from "@/src/stores/ui-store";
import type { Workspace } from "@/src/core/sync/types";

export type ShellUser = {
  displayName: string;
  email: string;
};

type Props = {
  user: ShellUser;
  workspaces: Workspace[];
  children: ReactNode;
};

function navClass(active: boolean) {
  return `block px-3 py-2 text-sm ${
    active
      ? "bg-ink text-canvas"
      : "text-muted hover:bg-ink hover:text-canvas"
  }`;
}

export function AppShell({ user, workspaces, children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const activeWorkspaceId = pathname.startsWith("/w/")
    ? pathname.split("/")[2]
    : null;
  const isInbox = pathname.includes("/inbox") || pathname === "/inbox";
  const isMembers = pathname.includes("/members");
  const isActivity = pathname.includes("/activity");
  const isBoard =
    Boolean(activeWorkspaceId) && !isInbox && !isMembers && !isActivity;

  return (
    <div className="flex min-h-full">
      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-ink/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-dashed border-hairline bg-canvas transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="border-b border-dashed border-hairline px-5 py-5">
          <p className="font-display text-lg font-bold tracking-[-0.04em] uppercase">
            Noirly Flow
          </p>
          <button
            type="button"
            onClick={() => useUIStore.getState().setCommandPaletteOpen(true)}
            className="mt-3 flex w-full items-center justify-between border border-dashed border-hairline px-3 py-2 text-left text-sm text-muted hover:bg-ink hover:text-canvas"
          >
            <span>Search</span>
            <span className="font-mono text-[10px]">⌘K</span>
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
          <section>
            <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              Workspace
            </p>
            <ul className="flex flex-col gap-px">
              {workspaces.map((workspace) => {
                const href = `/w/${workspace.id}`;
                const active = activeWorkspaceId === workspace.id;
                return (
                  <li key={workspace.id}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 text-sm ${
                        active
                          ? "bg-ink text-canvas"
                          : "text-muted hover:bg-ink hover:text-canvas"
                      }`}
                    >
                      <span className="truncate">{workspace.name}</span>
                      <span className="font-mono text-[10px] uppercase tracking-wide opacity-60">
                        {workspace.kind}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <CreateTeamWorkspace />
          </section>

          <section>
            <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              Navigate
            </p>
            <ul className="flex flex-col gap-px">
              <li>
                <Link
                  href={
                    activeWorkspaceId
                      ? `/w/${activeWorkspaceId}/inbox`
                      : "/inbox"
                  }
                  onClick={() => setOpen(false)}
                  className={navClass(isInbox)}
                >
                  Inbox
                </Link>
              </li>
              <li>
                <Link
                  href={
                    activeWorkspaceId
                      ? `/w/${activeWorkspaceId}`
                      : workspaces[0]
                        ? `/w/${workspaces[0].id}`
                        : "/"
                  }
                  onClick={() => setOpen(false)}
                  className={navClass(isBoard)}
                >
                  Board
                </Link>
              </li>
              <li>
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className={navClass(pathname.startsWith("/settings"))}
                >
                  Settings
                </Link>
              </li>
              {activeWorkspaceId ? (
                <li>
                  <Link
                    href={`/w/${activeWorkspaceId}/activity`}
                    onClick={() => setOpen(false)}
                    className={navClass(isActivity)}
                  >
                    Activity
                  </Link>
                </li>
              ) : null}
              {activeWorkspaceId ? (
                <li>
                  <Link
                    href={`/w/${activeWorkspaceId}/members`}
                    onClick={() => setOpen(false)}
                    className={navClass(pathname.includes("/members"))}
                  >
                    Members
                  </Link>
                </li>
              ) : null}
            </ul>
          </section>
        </nav>

        <div className="border-t border-dashed border-hairline px-4 py-4">
          <p className="truncate text-sm">{user.displayName}</p>
          <p className="truncate font-mono text-[11px] text-muted">{user.email}</p>
          <div className="mt-3">
            <SignOutButton />
          </div>
        </div>
      </aside>

      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-dashed border-hairline px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="border border-dashed border-hairline px-3 py-1.5 text-sm"
          >
            Menu
          </button>
          <p className="font-display text-sm font-bold tracking-[-0.04em] uppercase">
            Flow
          </p>
          <button
            type="button"
            onClick={() => useUIStore.getState().setCommandPaletteOpen(true)}
            className="ml-auto border border-dashed border-hairline px-3 py-1.5 font-mono text-sm text-muted"
          >
            ⌘K
          </button>
        </header>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      <CommandPalette workspaces={workspaces} />
    </div>
  );
}
