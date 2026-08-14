"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/src/lib/api-client";
import { qk } from "@/src/core/sync/query-keys";

export function CreateTeamWorkspace() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const createMutation = useMutation({
    mutationFn: () => api.createWorkspace(name),
    onSuccess: (result) => {
      setName("");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: qk.workspaces });
      router.push(`/w/${result.workspace.id}`);
      router.refresh();
    },
  });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 w-full px-3 py-2 text-left text-sm text-ink hover:bg-ink hover:text-canvas"
      >
        New team workspace
      </button>
    );
  }

  return (
    <form
      className="mt-2 flex flex-col gap-2 px-1"
      onSubmit={(event) => {
        event.preventDefault();
        if (!name.trim()) return;
        createMutation.mutate();
      }}
    >
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Team name"
        className="h-8 border border-dashed border-hairline bg-surface px-2 text-xs text-ink outline-none"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={createMutation.isPending || !name.trim()}
          className="h-8 flex-1 bg-ink text-xs font-semibold text-canvas disabled:opacity-50"
        >
          Create
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-8 border border-dashed border-hairline px-2 text-xs text-muted"
        >
          Cancel
        </button>
      </div>
      {createMutation.isError ? (
        <p className="text-xs text-ink">
          {(createMutation.error as Error).message}
        </p>
      ) : null}
    </form>
  );
}
