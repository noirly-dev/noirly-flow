"use client";

import {
  initials,
  memberName,
  type WorkspaceMember,
} from "@/src/features/workspace/members";

export function AssigneeChips({
  assigneeIds,
  members,
}: {
  assigneeIds: string[];
  members: WorkspaceMember[];
}) {
  if (!assigneeIds.length) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {assigneeIds.map((id) => {
        const name = memberName(members, id);
        return (
          <span
            key={id}
            title={name}
            className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-surface px-1.5 font-mono text-[10px] text-ink"
          >
            {initials(name)}
          </span>
        );
      })}
    </span>
  );
}
