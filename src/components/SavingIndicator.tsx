"use client";

import { useIsMutating } from "@tanstack/react-query";

export function SavingIndicator() {
  const pending = useIsMutating();
  if (pending === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[90] border border-[var(--hairline)] bg-[var(--bg)] px-3 py-2"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--muted-foreground)]">
        <span className="busy-dots mr-2 text-[var(--foreground)]">···</span>
        Saving
      </p>
    </div>
  );
}
