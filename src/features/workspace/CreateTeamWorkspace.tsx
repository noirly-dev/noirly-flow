"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input } from "@noirly-dev/ui";
import { api } from "@/src/lib/api-client";
import { qk } from "@/src/core/sync/query-keys";
import { useUIStore } from "@/src/stores/ui-store";

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
      const href = `/w/${result.workspace.id}`;
      useUIStore.getState().setPendingHref(href);
      router.push(href);
    },
  });

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="mt-2 w-full justify-start"
        onClick={() => setOpen(true)}
      >
        New team workspace
      </Button>
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
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Team name"
        className="h-8 text-xs"
      />
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={createMutation.isPending || !name.trim()}
          className="flex-1"
        >
          {createMutation.isPending ? "Saving…" : "Create"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
      {createMutation.isError ? (
        <p className="text-xs text-[var(--foreground)]">
          {(createMutation.error as Error).message}
        </p>
      ) : null}
    </form>
  );
}
