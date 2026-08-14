"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api-client";
import { qk } from "@/src/core/sync/query-keys";
import type { ActivityEvent } from "@/src/core/sync/types";
import {
  memberName,
  type WorkspaceMember,
} from "@/src/features/workspace/members";

type Props = {
  workspaceId: string;
  taskId: string;
  members: WorkspaceMember[];
};

function formatChange(value: unknown): string {
  if (value == null) return "none";
  if (typeof value === "string") return value.replaceAll("_", " ");
  return String(value);
}

function describeEvent(event: ActivityEvent, members: WorkspaceMember[]) {
  const actor = memberName(members, event.actorId);
  const meta = event.metadata ?? {};

  switch (event.verb) {
    case "task.created":
      return `${actor} created this task`;
    case "task.deleted":
      return `${actor} deleted this task`;
    case "comment.created":
      return `${actor} commented`;
    case "task.assigned": {
      const to = Array.isArray(meta.to)
        ? meta.to.map((id) => memberName(members, String(id)))
        : [];
      return to.length
        ? `${actor} assigned ${to.join(", ")}`
        : `${actor} cleared assignees`;
    }
    case "task.updated": {
      const parts: string[] = [];
      for (const [field, change] of Object.entries(meta)) {
        if (
          change &&
          typeof change === "object" &&
          "from" in change &&
          "to" in change
        ) {
          const typed = change as { from: unknown; to: unknown };
          parts.push(
            `${field} ${formatChange(typed.from)} → ${formatChange(typed.to)}`,
          );
        }
      }
      return parts.length
        ? `${actor} updated ${parts.join(", ")}`
        : `${actor} updated this task`;
    }
    default:
      return `${actor} ${event.verb}`;
  }
}

export function ActivityFeed({ workspaceId, taskId, members }: Props) {
  const activityQuery = useQuery({
    queryKey: qk.activity(workspaceId, taskId),
    queryFn: () => api.listActivity(workspaceId, { taskId }),
  });

  const items = activityQuery.data?.items ?? [];

  return (
    <section>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#737373]">
        Activity
      </p>
      {activityQuery.isLoading ? (
        <p className="text-xs text-[#737373]">Loading activity…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-[#737373]">No activity yet.</p>
      ) : (
        <ol className="space-y-2">
          {items.map((event) => (
            <li key={event.id} className="flex flex-col gap-0.5">
              <p className="text-xs text-[#A3A3A3]">
                {describeEvent(event, members)}
              </p>
              <time
                dateTime={event.createdAt}
                className="font-mono text-[10px] text-[#737373]"
              >
                {new Date(event.createdAt).toLocaleString()}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
