"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const AUTH_MESSAGE = "noirly-auth";
const AUTH_STORAGE_KEY = "noirly-auth";

function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function PopupCompleteInner() {
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  useEffect(() => {
    const payload = { type: AUTH_MESSAGE, next, t: Date.now() };
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore quota / private mode */
    }
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(payload, window.location.origin);
      window.close();
      return;
    }
    window.location.replace(next);
  }, [next]);

  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-6">
      <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted">
        Signed in. Returning to Flow…
      </p>
    </main>
  );
}

export default function LoginPopupCompletePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-full flex-1 items-center justify-center px-6">
          <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted">
            Finishing sign-in…
          </p>
        </main>
      }
    >
      <PopupCompleteInner />
    </Suspense>
  );
}
