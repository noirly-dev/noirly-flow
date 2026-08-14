"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { FlowBusyScreen } from "@/src/components/FlowBusyScreen";

function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function LoginPopupInner() {
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  useEffect(() => {
    void signIn("noirly", {
      redirectTo: `/login/popup-complete?next=${encodeURIComponent(next)}`,
      callbackUrl: `/login/popup-complete?next=${encodeURIComponent(next)}`,
    });
  }, [next]);

  return <FlowBusyScreen label="Signing in to Flow" />;
}

export default function LoginPopupPage() {
  return (
    <Suspense fallback={<FlowBusyScreen label="Signing in to Flow" />}>
      <LoginPopupInner />
    </Suspense>
  );
}
