"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/src/lib/api-client";
import { qk } from "@/src/core/sync/query-keys";
import type { Comment } from "@/src/core/sync/types";
import { memberName, type WorkspaceMember } from "@/src/features/workspace/members";

type Props = {
  taskId: string;
  workspaceId: string;
  members: WorkspaceMember[];
  canWrite?: boolean;
};

export function CommentThread({
  taskId,
  workspaceId,
  members,
  canWrite = true,
}: Props) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const commentsQuery = useQuery({
    queryKey: qk.comments(taskId),
    queryFn: () => api.listComments(taskId),
  });

  const createMutation = useMutation({
    mutationFn: (text: string) => api.createComment(taskId, text),
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: qk.comments(taskId) });
      const previous = queryClient.getQueryData<{ comments: Comment[] }>(
        qk.comments(taskId),
      );
      const now = new Date().toISOString();
      const optimistic = {
        id: `tmp-${crypto.randomUUID()}`,
        taskId,
        authorId: "",
        body: text,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      queryClient.setQueryData(qk.comments(taskId), {
        comments: [...(previous?.comments ?? []), optimistic],
      });
      setBody("");
      setError(null);
      return { previous, optimisticId: optimistic.id };
    },
    onSuccess: (data, _text, context) => {
      queryClient.setQueryData<{ comments: Comment[] }>(
        qk.comments(taskId),
        (old) => {
          if (!old) return { comments: [data.comment] };
          return {
            comments: old.comments.map((comment) =>
              comment.id === context?.optimisticId ? data.comment : comment,
            ),
          };
        },
      );
    },
    onError: (err: Error, _text, context) => {
      if (context?.previous) {
        queryClient.setQueryData(qk.comments(taskId), context.previous);
      }
      setError(err.message);
    },
  });

  const comments = commentsQuery.data?.comments ?? [];

  return (
    <section>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
        Comments
      </p>
      <ul className="space-y-3">
        {comments.map((comment) => (
          <li key={comment.id} className="border border-dashed border-hairline bg-surface px-3 py-2">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-medium text-ink">
                {memberName(members, comment.authorId)}
              </p>
              <time
                dateTime={comment.createdAt}
                className="font-mono text-[10px] text-muted"
              >
                {new Date(comment.createdAt).toLocaleString()}
              </time>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
              {comment.body}
            </p>
          </li>
        ))}
        {commentsQuery.isLoading ? (
          <li className="text-xs text-muted">Loading comments…</li>
        ) : comments.length === 0 ? (
          <li className="text-xs text-muted">No comments yet.</li>
        ) : null}
      </ul>
      {canWrite ? (
      <form
        className="mt-3 flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!body.trim()) return;
          createMutation.mutate(body.trim());
        }}
      >
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write a comment…"
          rows={3}
          className="w-full resize-none border border-dashed border-hairline bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-muted"
        />
        <div className="flex items-center justify-between">
          {error ? (
            <p className="text-xs text-ink" role="alert">
              {error}
            </p>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={!body.trim()}
            className="h-8 bg-ink px-3 text-xs font-semibold text-canvas disabled:opacity-50"
          >
            Comment
          </button>
        </div>
      </form>
      ) : null}
    </section>
  );
}
