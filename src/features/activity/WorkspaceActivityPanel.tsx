"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityFeed } from "@/src/features/activity/ActivityFeed";
import { activityToCsv } from "@/src/features/activity/format";
import { api } from "@/src/lib/api-client";
import { qk } from "@/src/core/sync/query-keys";

type Props = {
  workspaceId: string;
  workspaceName: string;
};

export function WorkspaceActivityPanel({
  workspaceId,
  workspaceName,
}: Props) {
  const [error, setError] = useState<string | null>(null);

  const membersQuery = useQuery({
    queryKey: qk.members(workspaceId),
    queryFn: () => api.listMembers(workspaceId),
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const members = membersQuery.data?.members ?? [];
      const events = [];
      let cursor: string | undefined;
      for (let page = 0; page < 50; page += 1) {
        const result = await api.listActivity(workspaceId, { cursor });
        events.push(...result.items);
        if (!result.nextCursor) break;
        cursor = result.nextCursor;
      }
      return activityToCsv(events, members);
    },
    onSuccess: (csv) => {
      setError(null);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      anchor.href = url;
      anchor.download = `${workspaceName.toLowerCase().replace(/\s+/g, "-")}-activity-${stamp}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Workspace-wide create, update, assign, and comment history.
        </p>
        <button
          type="button"
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending || membersQuery.isLoading}
          className="h-9 border border-dashed border-hairline px-3 text-sm text-ink hover:border-ink disabled:opacity-50"
        >
          {exportMutation.isPending ? "Exporting…" : "Export CSV"}
        </button>
      </div>
      {error ? (
        <p className="text-sm text-ink" role="alert">
          {error}
        </p>
      ) : null}
      <div className="border border-dashed border-hairline bg-surface p-5">
        <ActivityFeed
          workspaceId={workspaceId}
          members={membersQuery.data?.members ?? []}
        />
      </div>
    </div>
  );
}
