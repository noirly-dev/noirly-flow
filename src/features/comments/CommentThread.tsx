"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/src/lib/api-client";
import { qk } from "@/src/core/sync/query-keys";
import { memberName, type WorkspaceMember } from "@/src/features/workspace/members";

type Props = {
  taskId: string;
  workspaceId: string;
  members: WorkspaceMember[];
};

export function CommentThread({ taskId, workspaceId, members }: Props) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const commentsQuery = useQuery({
    queryKey: qk.comments(taskId),
    queryFn: () => api.listComments(taskId),
  });

  const createMutation = useMutation({
    mutationFn: () => api.createComment(taskId, body),
    onSuccess: () => {
      setBody("");
      setError(null);
      void queryClient.invalidateQueries({ queryKey: qk.comments(taskId) });
      void queryClient.invalidateQueries({
        queryKey: qk.activity(workspaceId, taskId),
      });
    },
    onError: (err: Error) => setError(err.message),
  });

  const comments = commentsQuery.data?.comments ?? [];

  return (
    <section>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#737373]">
        Comments
      </p>
      <ul className="space-y-3">
        {comments.map((comment) => (
          <li key={comment.id} className="rounded-lg border border-[#2A2A2A] bg-[#1E1E1E] px-3 py-2">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-medium text-[#F5F5F5]">
                {memberName(members, comment.authorId)}
              </p>
              <time
                dateTime={comment.createdAt}
                className="font-mono text-[10px] text-[#737373]"
              >
                {new Date(comment.createdAt).toLocaleString()}
              </time>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-[#A3A3A3]">
              {comment.body}
            </p>
          </li>
        ))}
        {commentsQuery.isLoading ? (
          <li className="text-xs text-[#737373]">Loading comments…</li>
        ) : comments.length === 0 ? (
          <li className="text-xs text-[#737373]">No comments yet.</li>
        ) : null}
      </ul>
      <form
        className="mt-3 flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!body.trim()) return;
          createMutation.mutate();
        }}
      >
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write a comment…"
          rows={3}
          className="w-full resize-none rounded-lg border border-[#2A2A2A] bg-[#1E1E1E] px-3 py-2 text-sm text-[#F5F5F5] outline-none placeholder:text-[#737373]"
        />
        <div className="flex items-center justify-between">
          {error ? (
            <p className="text-xs text-[#D9A759]" role="alert">
              {error}
            </p>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={createMutation.isPending || !body.trim()}
            className="h-8 rounded-lg bg-[#52D3FE] px-3 text-xs font-semibold text-[#121212] disabled:opacity-50"
          >
            Comment
          </button>
        </div>
      </form>
    </section>
  );
}
