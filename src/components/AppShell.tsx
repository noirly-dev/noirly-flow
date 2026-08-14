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

export function AppShell({ user, workspaces, children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const activeWorkspaceId = pathname.startsWith("/w/")
    ? pathname.split("/")[2]
    : null;

  return (
    <div className="flex min-h-full">
      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[#2A2A2A] bg-[#121212] transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="border-b border-[#2A2A2A] px-5 py-5">
          <p className="font-mono text-[11px] tracking-[0.2em] text-[#52D3FE]">
            NOIRLY FLOW
          </p>
          <button
            type="button"
            onClick={() => useUIStore.getState().setCommandPaletteOpen(true)}
            className="mt-3 flex w-full items-center justify-between rounded-lg border border-[#2A2A2A] bg-[#1E1E1E] px-3 py-2 text-left text-sm text-[#A3A3A3] hover:text-[#F5F5F5]"
          >
            <span>Search</span>
            <span className="font-mono text-[10px] text-[#737373]">⌘K</span>
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
          <section>
            <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#737373]">
              Workspace
            </p>
            <ul className="flex flex-col gap-1">
              {workspaces.map((workspace) => {
                const href = `/w/${workspace.id}`;
                const active = activeWorkspaceId === workspace.id;
                return (
                  <li key={workspace.id}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                        active
                          ? "bg-[#1E1E1E] text-[#F5F5F5]"
                          : "text-[#A3A3A3] hover:bg-[#1E1E1E] hover:text-[#F5F5F5]"
                      }`}
                    >
                      <span className="truncate">{workspace.name}</span>
                      <span className="font-mono text-[10px] uppercase tracking-wide text-[#737373]">
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
            <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#737373]">
              Navigate
            </p>
            <ul className="flex flex-col gap-1">
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
                  className={`block rounded-lg px-3 py-2 text-sm ${
                    pathname.startsWith("/w/")
                      ? "bg-[#1E1E1E] text-[#F5F5F5]"
                      : "text-[#A3A3A3] hover:bg-[#1E1E1E] hover:text-[#F5F5F5]"
                  }`}
                >
                  Board
                </Link>
              </li>
              <li>
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg px-3 py-2 text-sm ${
                    pathname.startsWith("/settings")
                      ? "bg-[#1E1E1E] text-[#F5F5F5]"
                      : "text-[#A3A3A3] hover:bg-[#1E1E1E] hover:text-[#F5F5F5]"
                  }`}
                >
                  Settings
                </Link>
              </li>
              {activeWorkspaceId ? (
                <li>
                  <Link
                    href={`/w/${activeWorkspaceId}/members`}
                    onClick={() => setOpen(false)}
                    className={`block rounded-lg px-3 py-2 text-sm ${
                      pathname.includes("/members")
                        ? "bg-[#1E1E1E] text-[#F5F5F5]"
                        : "text-[#A3A3A3] hover:bg-[#1E1E1E] hover:text-[#F5F5F5]"
                    }`}
                  >
                    Members
                  </Link>
                </li>
              ) : null}
            </ul>
          </section>
        </nav>

        <div className="border-t border-[#2A2A2A] px-4 py-4">
          <p className="truncate text-sm text-[#F5F5F5]">{user.displayName}</p>
          <p className="truncate text-xs text-[#737373]">{user.email}</p>
          <div className="mt-3">
            <SignOutButton />
          </div>
        </div>
      </aside>

      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-[#2A2A2A] px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-md border border-[#2A2A2A] px-3 py-1.5 text-sm text-[#F5F5F5]"
          >
            Menu
          </button>
          <p className="font-mono text-[11px] tracking-[0.2em] text-[#52D3FE]">
            NOIRLY FLOW
          </p>
          <button
            type="button"
            onClick={() => useUIStore.getState().setCommandPaletteOpen(true)}
            className="ml-auto rounded-md border border-[#2A2A2A] px-3 py-1.5 text-sm text-[#A3A3A3]"
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
