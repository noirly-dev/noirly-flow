import { create } from "zustand";

const LAST_WORKSPACE_KEY = "noirly-flow-workspace";

export function readLastWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(LAST_WORKSPACE_KEY);
  } catch {
    return null;
  }
}

type UIState = {
  commandPaletteOpen: boolean;
  pendingHref: string | null;
  lastWorkspaceId: string | null;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setPendingHref: (href: string | null) => void;
  setLastWorkspaceId: (id: string) => void;
};

export const useUIStore = create<UIState>((set) => ({
  commandPaletteOpen: false,
  pendingHref: null,
  lastWorkspaceId: null,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  setPendingHref: (href) => set({ pendingHref: href }),
  setLastWorkspaceId: (id) => {
    try {
      window.sessionStorage.setItem(LAST_WORKSPACE_KEY, id);
    } catch {
      /* ignore quota / private mode */
    }
    set({ lastWorkspaceId: id });
  },
}));
