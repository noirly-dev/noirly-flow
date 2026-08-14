"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "@/src/lib/api-client";
import { qk } from "@/src/core/sync/query-keys";
import type { ChecklistItem, RecurrenceRule, Tag, Task } from "@/src/core/sync/types";
import type { TaskPriority, TaskStatus } from "@/src/core/models/enums";
import { ActivityFeed } from "@/src/features/activity/ActivityFeed";
import { CommentThread } from "@/src/features/comments/CommentThread";
import { dateInputToIso, isoToDateInput } from "@/src/features/task/dates";

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
  { value: "canceled", label: "Canceled" },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "none", label: "None" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

type Props = {
  workspaceId: string;
  taskId: string;
  onClose: () => void;
};

export function TaskDrawer({ workspaceId, taskId, onClose }: Props) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("none");
  const [dueDate, setDueDate] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newCheck, setNewCheck] = useState("");
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(null);
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState<string | null>(null);

  const taskQuery = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => api.getTask(taskId),
  });

  const tagsQuery = useQuery({
    queryKey: ["tags", workspaceId],
    queryFn: () => api.listTags(workspaceId),
  });

  const membersQuery = useQuery({
    queryKey: qk.members(workspaceId),
    queryFn: () => api.listMembers(workspaceId),
  });

  useEffect(() => {
    const task = taskQuery.data?.task;
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(isoToDateInput(task.dueAt));
    setTagIds(task.tagIds);
    setAssigneeIds(task.assigneeIds ?? []);
    setChecklist(task.checklist ?? []);
    setRecurrence(task.recurrence);
  }, [taskQuery.data]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const saveMutation = useMutation({
    mutationFn: (patch: Partial<Task>) => api.updateTask(taskId, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      void queryClient.invalidateQueries({
        queryKey: qk.activity(workspaceId, taskId),
      });
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const createTagMutation = useMutation({
    mutationFn: () => api.createTag(workspaceId, { name: newTag }),
    onSuccess: (result) => {
      setNewTag("");
      setTagIds((current) =>
        current.includes(result.tag.id) ? current : [...current, result.tag.id],
      );
      void queryClient.invalidateQueries({ queryKey: ["tags", workspaceId] });
      void saveMutation.mutateAsync({
        tagIds: [...tagIds, result.tag.id],
      });
    },
    onError: (err: Error) => setError(err.message),
  });

  function persist(patch: Partial<Task>) {
    void saveMutation.mutateAsync(patch);
  }

  const tags = tagsQuery.data?.tags ?? [];

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Close task"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-[#2A2A2A] bg-[#121212]">
        <header className="flex items-center justify-between border-b border-[#2A2A2A] px-5 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#737373]">
            Task
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[#A3A3A3] hover:text-[#F5F5F5]"
          >
            Close
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {taskQuery.isLoading ? (
            <p className="text-sm text-[#A3A3A3]">Loading…</p>
          ) : taskQuery.isError ? (
            <p className="text-sm text-[#D9A759]">Could not load task.</p>
          ) : (
            <>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={() => {
                  if (title.trim()) persist({ title: title.trim() });
                }}
                className="w-full bg-transparent text-xl font-semibold text-[#F5F5F5] outline-none"
              />

              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                onBlur={() => persist({ description: description.trim() || null })}
                placeholder="Add a description…"
                rows={3}
                className="w-full resize-none rounded-lg border border-[#2A2A2A] bg-[#1E1E1E] px-3 py-2 text-sm text-[#F5F5F5] outline-none placeholder:text-[#737373]"
              />

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1 text-xs text-[#A3A3A3]">
                  Status
                  <select
                    value={status}
                    onChange={(event) => {
                      const next = event.target.value as TaskStatus;
                      setStatus(next);
                      persist({ status: next });
                    }}
                    className="h-10 w-full rounded-lg border border-[#2A2A2A] bg-[#1E1E1E] px-2 text-sm text-[#F5F5F5]"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-xs text-[#A3A3A3]">
                  Priority
                  <select
                    value={priority}
                    onChange={(event) => {
                      const next = event.target.value as TaskPriority;
                      setPriority(next);
                      persist({ priority: next });
                    }}
                    className="h-10 w-full rounded-lg border border-[#2A2A2A] bg-[#1E1E1E] px-2 text-sm text-[#F5F5F5]"
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="col-span-2 space-y-1 text-xs text-[#A3A3A3]">
                  Due date
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(event) => {
                      setDueDate(event.target.value);
                      persist({ dueAt: dateInputToIso(event.target.value) });
                    }}
                    className="h-10 w-full rounded-lg border border-[#2A2A2A] bg-[#1E1E1E] px-2 text-sm text-[#F5F5F5]"
                  />
                </label>
                <label className="col-span-2 space-y-1 text-xs text-[#A3A3A3]">
                  Repeat
                  <select
                    value={recurrence?.frequency ?? ""}
                    onChange={(event) => {
                      const value = event.target.value as RecurrenceRule["frequency"] | "";
                      const next = value
                        ? { frequency: value, interval: 1 }
                        : null;
                      setRecurrence(next);
                      persist({ recurrence: next });
                    }}
                    className="h-10 w-full rounded-lg border border-[#2A2A2A] bg-[#1E1E1E] px-2 text-sm text-[#F5F5F5]"
                  >
                    <option value="">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </label>
              </div>

              <section>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#737373]">
                  Assignees
                </p>
                <div className="flex flex-wrap gap-2">
                  {(membersQuery.data?.members ?? []).map((member) => {
                    const selected = assigneeIds.includes(member.userId);
                    return (
                      <button
                        key={member.userId}
                        type="button"
                        onClick={() => {
                          const next = selected
                            ? assigneeIds.filter((id) => id !== member.userId)
                            : [...assigneeIds, member.userId];
                          setAssigneeIds(next);
                          persist({ assigneeIds: next });
                        }}
                        className={`rounded-full border px-3 py-1 text-xs ${
                          selected
                            ? "border-[#52D3FE] bg-[#52D3FE] text-[#121212]"
                            : "border-[#2A2A2A] text-[#A3A3A3]"
                        }`}
                      >
                        {member.displayName}
                      </button>
                    );
                  })}
                  {membersQuery.isLoading ? (
                    <span className="text-xs text-[#737373]">Loading members…</span>
                  ) : null}
                </div>
              </section>

              <section>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#737373]">
                  Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const selected = tagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          const next = selected
                            ? tagIds.filter((id) => id !== tag.id)
                            : [...tagIds, tag.id];
                          setTagIds(next);
                          persist({ tagIds: next });
                        }}
                        className={`rounded-full border px-3 py-1 text-xs ${
                          selected
                            ? "border-transparent text-[#121212]"
                            : "border-[#2A2A2A] text-[#A3A3A3]"
                        }`}
                        style={
                          selected
                            ? { backgroundColor: tag.color }
                            : { borderColor: tag.color, color: tag.color }
                        }
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!newTag.trim()) return;
                    createTagMutation.mutate();
                  }}
                >
                  <input
                    value={newTag}
                    onChange={(event) => setNewTag(event.target.value)}
                    placeholder="New tag"
                    className="h-9 flex-1 rounded-lg border border-[#2A2A2A] bg-[#1E1E1E] px-3 text-sm text-[#F5F5F5] outline-none"
                  />
                  <button
                    type="submit"
                    className="h-9 rounded-lg border border-[#2A2A2A] px-3 text-xs text-[#A3A3A3]"
                  >
                    Add
                  </button>
                </form>
              </section>

              <section>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#737373]">
                  Checklist
                </p>
                <ul className="space-y-2">
                  {checklist.map((item, index) => (
                    <li key={item.id || index} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => {
                          const next = checklist.map((entry, entryIndex) =>
                            entryIndex === index
                              ? { ...entry, completed: !entry.completed }
                              : entry,
                          );
                          setChecklist(next);
                          persist({ checklist: next });
                        }}
                      />
                      <span
                        className={`flex-1 text-sm ${
                          item.completed
                            ? "text-[#737373] line-through"
                            : "text-[#F5F5F5]"
                        }`}
                      >
                        {item.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = checklist.filter((_, entryIndex) => entryIndex !== index);
                          setChecklist(next);
                          persist({ checklist: next });
                        }}
                        className="text-xs text-[#737373] hover:text-[#D9A759]"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!newCheck.trim()) return;
                    const next = [
                      ...checklist,
                      {
                        id: `tmp-${Date.now()}`,
                        title: newCheck.trim(),
                        completed: false,
                        position: (checklist.length + 1) * 1000,
                      },
                    ];
                    setNewCheck("");
                    setChecklist(next);
                    persist({ checklist: next });
                  }}
                >
                  <input
                    value={newCheck}
                    onChange={(event) => setNewCheck(event.target.value)}
                    placeholder="Add checklist item"
                    className="h-9 flex-1 rounded-lg border border-[#2A2A2A] bg-[#1E1E1E] px-3 text-sm text-[#F5F5F5] outline-none"
                  />
                  <button
                    type="submit"
                    className="h-9 rounded-lg border border-[#2A2A2A] px-3 text-xs text-[#A3A3A3]"
                  >
                    Add
                  </button>
                </form>
              </section>

              <CommentThread
                taskId={taskId}
                workspaceId={workspaceId}
                members={membersQuery.data?.members ?? []}
              />
              <ActivityFeed
                workspaceId={workspaceId}
                taskId={taskId}
                members={membersQuery.data?.members ?? []}
              />
            </>
          )}
          {error ? (
            <p className="text-sm text-[#D9A759]" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

export function TagChips({
  tagIds,
  tags,
}: {
  tagIds: string[];
  tags: Tag[];
}) {
  if (!tagIds.length) return null;
  const selected = tags.filter((tag) => tagIds.includes(tag.id));
  if (!selected.length) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {selected.map((tag) => (
        <span
          key={tag.id}
          className="rounded-full px-2 py-0.5 text-[10px] text-[#121212]"
          style={{ backgroundColor: tag.color }}
        >
          {tag.name}
        </span>
      ))}
    </span>
  );
}
