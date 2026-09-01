"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@noirly-dev/ui";
import { FlowBusyScreen } from "@/src/components/FlowBusyScreen";

export function SignOutButton() {
  const [busy, setBusy] = useState(false);

  async function onSignOut() {
    setBusy(true);
    try {
      await signOut({ callbackUrl: "/login", redirect: true });
    } catch {
      window.location.assign("/login");
    }
  }

  return (
    <>
      {busy
        ? createPortal(<FlowBusyScreen label="Signing out" />, document.body)
        : null}
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-start"
        onClick={() => void onSignOut()}
        disabled={busy}
      >
        <LogOut size={16} />
        Sign out
      </Button>
    </>
  );
}
