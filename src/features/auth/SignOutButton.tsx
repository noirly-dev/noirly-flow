"use client";

import { signOutAction } from "@/src/features/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        className="w-full rounded-lg border border-[#2A2A2A] px-3 py-1.5 text-left text-sm text-[#A3A3A3] hover:bg-[#1E1E1E] hover:text-[#F5F5F5]"
        type="submit"
      >
        Sign out
      </button>
    </form>
  );
}
