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
        className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-[#52D3FE] hover:bg-[#1E1E1E]"
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
        className="h-8 rounded-md border border-[#2A2A2A] bg-[#1E1E1E] px-2 text-xs text-[#F5F5F5] outline-none"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={createMutation.isPending || !name.trim()}
          className="h-8 flex-1 rounded-md bg-[#52D3FE] text-xs font-semibold text-[#121212] disabled:opacity-50"
        >
          Create
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-8 rounded-md border border-[#2A2A2A] px-2 text-xs text-[#A3A3A3]"
        >
          Cancel
        </button>
      </div>
      {createMutation.isError ? (
        <p className="text-xs text-[#D9A759]">
          {(createMutation.error as Error).message}
        </p>
      ) : null}
    </form>
  );
}
