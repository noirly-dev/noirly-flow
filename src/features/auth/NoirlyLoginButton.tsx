"use client";

import { useEffect, useState } from "react";

const AUTH_MESSAGE = "noirly-auth";
const AUTH_STORAGE_KEY = "noirly-auth";

function safeNext(value: string): string {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function NoirlyLoginButton({ redirectTo = "/" }: { redirectTo?: string }) {
  const target = safeNext(redirectTo);
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    function finish(next: string) {
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      window.location.assign(safeNext(next));
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; next?: string } | null;
      if (data?.type !== AUTH_MESSAGE) return;
      finish(data.next ?? target);
    }

    function onStorage(event: StorageEvent) {
      if (event.key !== AUTH_STORAGE_KEY || !event.newValue) return;
      try {
        const payload = JSON.parse(event.newValue) as { next?: string };
        finish(payload.next ?? target);
      } catch {
        finish(target);
      }
    }

    window.addEventListener("message", onMessage);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("storage", onStorage);
    };
  }, [target]);

  function openIdentityPopup() {
    setError(null);
    const width = 480;
    const height = 740;
    const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
    const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));
    const url = `/login/popup?next=${encodeURIComponent(target)}`;
    const popup = window.open(
      url,
      "noirly-identity",
      `popup=yes,width=${width},height=${height},left=${left},top=${top}`,
    );
    if (!popup) {
      setError("Allow popups for Noirly Flow, then try again.");
      return;
    }
    setWaiting(true);
    popup.focus();
    const timer = window.setInterval(() => {
      try {
        if (popup.closed) {
          window.clearInterval(timer);
          setWaiting(false);
        }
      } catch {
        window.clearInterval(timer);
        setWaiting(false);
      }
    }, 400);
  }

  return (
    <div className="flex flex-col gap-3">
      {waiting ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/85"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-5 px-6">
            <span className="busy-dots font-mono text-4xl font-bold tracking-[0.45em] text-ink">
              ···
            </span>
            <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted">
              Waiting for Identity
            </p>
          </div>
        </div>
      ) : null}
      <button
        className="flex h-12 w-full items-center justify-center bg-panel-ink px-5 font-mono text-[11px] font-semibold tracking-[0.16em] text-panel uppercase transition-colors hover:bg-transparent hover:text-panel-ink hover:outline hover:outline-1 hover:outline-dashed hover:outline-panel-ink disabled:opacity-50"
        type="button"
        onClick={openIdentityPopup}
        disabled={waiting}
      >
        {waiting ? "Waiting for Identity…" : "Noirly Login"}
      </button>
      {error ? (
        <p className="font-mono text-[11px] tracking-[0.08em] text-panel-ink/70">{error}</p>
      ) : null}
    </div>
  );
}
