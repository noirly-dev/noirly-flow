"use client";

import { signOutAction } from "@/src/features/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        className="w-full border border-dashed border-hairline px-3 py-1.5 text-left text-sm text-muted hover:bg-ink hover:text-canvas"
        type="submit"
      >
        Sign out
      </button>
    </form>
  );
}
