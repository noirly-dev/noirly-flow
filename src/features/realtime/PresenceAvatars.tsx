"use client";

import type { PresenceMember } from "@noirly-dev/realtime-shared";
import type { ClientStatus } from "@noirly-dev/realtime-client";

export function PresenceAvatars({
  members,
  status,
}: {
  members: PresenceMember[];
  status: ClientStatus;
}) {
  const shown = members.slice(0, 5);
  const extra = members.length - shown.length;
  const live = status === "ready";

  return (
    <div className="flex items-center gap-2" aria-label="Who is viewing">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          live ? "bg-[var(--accent)]" : "bg-[var(--muted)]"
        }`}
        title={live ? "Live" : status}
      />
      <ul className="flex -space-x-2">
        {shown.map((member) => {
          const name =
            typeof member.data.name === "string" && member.data.name.length > 0
              ? member.data.name
              : member.userId;
          const initial = name.slice(0, 1).toUpperCase();
          return (
            <li
              key={member.clientId}
              title={name}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--background)] bg-[var(--surface)] text-[11px] font-medium text-[var(--foreground)]"
            >
              {initial}
            </li>
          );
        })}
      </ul>
      {extra > 0 ? (
        <span className="font-mono text-[11px] text-[var(--muted-foreground)]">
          +{extra}
        </span>
      ) : null}
    </div>
  );
}
