import { create } from "zustand";

type UIState = {
  commandPaletteOpen: boolean;
  pendingHref: string | null;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setPendingHref: (href: string | null) => void;
};

export const useUIStore = create<UIState>((set) => ({
  commandPaletteOpen: false,
  pendingHref: null,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  setPendingHref: (href) => set({ pendingHref: href }),
}));
