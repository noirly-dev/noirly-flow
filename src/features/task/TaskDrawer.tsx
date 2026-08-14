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
import { useCan } from "@/src/features/workspace/WorkspaceRoleContext";

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
  const canWrite = useCan("task.write");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("none");
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState<string | "">("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newCheck, setNewCheck] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(null);
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState<string | null>(null);

  const taskQuery = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => api.getTask(taskId),
  });

  const projectsQuery = useQuery({
    queryKey: qk.projects(workspaceId),
    queryFn: () => api.listProjects(workspaceId),
  });

  const subtasksQuery = useQuery({
    queryKey: ["tasks", workspaceId, { parentTaskId: taskId }],
    queryFn: () => api.listTasks(workspaceId, { parentTaskId: taskId }),
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
    setProjectId(task.projectId ?? "");
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

  const createSubtaskMutation = useMutation({
    mutationFn: () =>
      api.createTask(workspaceId, {
        title: newSubtask.trim(),
        parentTaskId: taskId,
        projectId: taskQuery.data?.task.projectId ?? null,
      }),
    onSuccess: () => {
      setNewSubtask("");
      setError(null);
      void queryClient.invalidateQueries({
        queryKey: ["tasks", workspaceId],
      });
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
    if (!canWrite) return;
    void saveMutation.mutateAsync(patch);
  }

  const tags = tagsQuery.data?.tags ?? [];
  const projects = projectsQuery.data?.projects ?? [];
  const subtasks = subtasksQuery.data?.tasks ?? [];
  const isSubtask = Boolean(taskQuery.data?.task.parentTaskId);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Close task"
        className="absolute inset-0 bg-ink/50"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-dashed border-hairline bg-canvas">
        <header className="flex items-center justify-between border-b border-dashed border-hairline px-5 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            Task
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted hover:text-ink"
          >
            Close
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {taskQuery.isLoading ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : taskQuery.isError ? (
            <p className="text-sm text-ink">Could not load task.</p>
          ) : (
            <>
              <input
                value={title}
                readOnly={!canWrite}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={() => {
                  if (title.trim()) persist({ title: title.trim() });
                }}
                className="w-full bg-transparent text-xl font-semibold text-ink outline-none read-only:text-muted"
              />

              <textarea
                value={description}
                readOnly={!canWrite}
                onChange={(event) => setDescription(event.target.value)}
                onBlur={() => persist({ description: description.trim() || null })}
                placeholder="Add a description…"
                rows={3}
                className="w-full resize-none border border-dashed border-hairline bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-muted read-only:text-muted"
              />

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1 text-xs text-muted">
                  Status
                  <select
                    value={status}
                    disabled={!canWrite}
                    onChange={(event) => {
                      const next = event.target.value as TaskStatus;
                      setStatus(next);
                      persist({ status: next });
                    }}
                    className="h-10 w-full border border-dashed border-hairline bg-surface px-2 text-sm text-ink disabled:opacity-50"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-xs text-muted">
                  Priority
                  <select
                    value={priority}
                    disabled={!canWrite}
                    onChange={(event) => {
                      const next = event.target.value as TaskPriority;
                      setPriority(next);
                      persist({ priority: next });
                    }}
                    className="h-10 w-full border border-dashed border-hairline bg-surface px-2 text-sm text-ink disabled:opacity-50"
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="col-span-2 space-y-1 text-xs text-muted">
                  Project
                  <select
                    value={projectId}
                    disabled={!canWrite}
                    onChange={(event) => {
                      const next = event.target.value;
                      setProjectId(next);
                      persist({ projectId: next || null });
                    }}
                    className="h-10 w-full border border-dashed border-hairline bg-surface px-2 text-sm text-ink disabled:opacity-50"
                  >
                    <option value="">Inbox</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="col-span-2 space-y-1 text-xs text-muted">
                  Due date
                  <input
                    type="date"
                    value={dueDate}
                    disabled={!canWrite}
                    onChange={(event) => {
                      setDueDate(event.target.value);
                      persist({ dueAt: dateInputToIso(event.target.value) });
                    }}
                    className="h-10 w-full border border-dashed border-hairline bg-surface px-2 text-sm text-ink disabled:opacity-50"
                  />
                </label>
                <label className="col-span-2 space-y-1 text-xs text-muted">
                  Repeat
                  <select
                    value={recurrence?.frequency ?? ""}
                    disabled={!canWrite}
                    onChange={(event) => {
                      const value = event.target.value as RecurrenceRule["frequency"] | "";
                      const next = value
                        ? { frequency: value, interval: 1 }
                        : null;
                      setRecurrence(next);
                      persist({ recurrence: next });
                    }}
                    className="h-10 w-full border border-dashed border-hairline bg-surface px-2 text-sm text-ink disabled:opacity-50"
                  >
                    <option value="">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </label>
              </div>

              <section>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                  Assignees
                </p>
                <div className="flex flex-wrap gap-2">
                  {(membersQuery.data?.members ?? []).map((member) => {
                    const selected = assigneeIds.includes(member.userId);
                    return (
                      <button
                        key={member.userId}
                        type="button"
                        disabled={!canWrite}
                        onClick={() => {
                          const next = selected
                            ? assigneeIds.filter((id) => id !== member.userId)
                            : [...assigneeIds, member.userId];
                          setAssigneeIds(next);
                          persist({ assigneeIds: next });
                        }}
                        className={`border px-3 py-1 text-xs disabled:opacity-50 ${
                          selected
                            ? "border-ink bg-ink text-canvas"
                            : "border-dashed border-hairline text-muted"
                        }`}
                      >
                        {member.displayName}
                      </button>
                    );
                  })}
                  {membersQuery.isLoading ? (
                    <span className="text-xs text-muted">Loading members…</span>
                  ) : null}
                </div>
              </section>

              <section>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                  Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const selected = tagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        disabled={!canWrite}
                        onClick={() => {
                          const next = selected
                            ? tagIds.filter((id) => id !== tag.id)
                            : [...tagIds, tag.id];
                          setTagIds(next);
                          persist({ tagIds: next });
                        }}
                        className={`border px-3 py-1 text-xs disabled:opacity-50 ${
                          selected
                            ? "border-ink bg-ink text-canvas"
                            : "border-dashed border-hairline text-muted"
                        }`}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
                {canWrite ? (
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
                    className="h-9 flex-1 border border-dashed border-hairline bg-surface px-3 text-sm text-ink outline-none"
                  />
                  <button
                    type="submit"
                    className="h-9 border border-dashed border-hairline px-3 text-xs text-muted"
                  >
                    Add
                  </button>
                </form>
                ) : null}
              </section>

              <section>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                  Checklist
                </p>
                <ul className="space-y-2">
                  {checklist.map((item, index) => (
                    <li key={item.id || index} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        disabled={!canWrite}
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
                            ? "text-muted line-through"
                            : "text-ink"
                        }`}
                      >
                        {item.title}
                      </span>
                      {canWrite ? (
                        <button
                          type="button"
                          onClick={() => {
                            const next = checklist.filter((_, entryIndex) => entryIndex !== index);
                            setChecklist(next);
                            persist({ checklist: next });
                          }}
                          className="text-xs text-muted hover:text-ink"
                        >
                          Remove
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {canWrite ? (
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
                    className="h-9 flex-1 border border-dashed border-hairline bg-surface px-3 text-sm text-ink outline-none"
                  />
                  <button
                    type="submit"
                    className="h-9 border border-dashed border-hairline px-3 text-xs text-muted"
                  >
                    Add
                  </button>
                </form>
                ) : null}
              </section>

              {!isSubtask ? (
                <section>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                    Subtasks
                  </p>
                  <ul className="space-y-2">
                    {subtasks.map((subtask) => (
                      <li
                        key={subtask.id}
                        className="flex items-center gap-2 border border-dashed border-hairline bg-surface px-3 py-2"
                      >
                        <input
                          type="checkbox"
                          checked={subtask.status === "done"}
                          disabled={!canWrite}
                          onChange={() => {
                            void api
                              .updateTask(subtask.id, {
                                status:
                                  subtask.status === "done" ? "todo" : "done",
                              })
                              .then(() =>
                                queryClient.invalidateQueries({
                                  queryKey: ["tasks", workspaceId],
                                }),
                              )
                              .catch((err: Error) => setError(err.message));
                          }}
                        />
                        <span
                          className={`flex-1 text-sm ${
                            subtask.status === "done"
                              ? "text-muted line-through"
                              : "text-ink"
                          }`}
                        >
                          {subtask.title}
                        </span>
                      </li>
                    ))}
                    {subtasksQuery.isLoading ? (
                      <li className="text-xs text-muted">Loading…</li>
                    ) : subtasks.length === 0 ? (
                      <li className="text-xs text-muted">No subtasks yet.</li>
                    ) : null}
                  </ul>
                  {canWrite ? (
                    <form
                      className="mt-3 flex gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (!newSubtask.trim()) return;
                        createSubtaskMutation.mutate();
                      }}
                    >
                      <input
                        value={newSubtask}
                        onChange={(event) => setNewSubtask(event.target.value)}
                        placeholder="Add subtask"
                        className="h-9 flex-1 border border-dashed border-hairline bg-surface px-3 text-sm text-ink outline-none"
                      />
                      <button
                        type="submit"
                        disabled={createSubtaskMutation.isPending}
                        className="h-9 border border-dashed border-hairline px-3 text-xs text-muted disabled:opacity-50"
                      >
                        Add
                      </button>
                    </form>
                  ) : null}
                </section>
              ) : null}

              <CommentThread
                taskId={taskId}
                workspaceId={workspaceId}
                members={membersQuery.data?.members ?? []}
                canWrite={canWrite}
              />
              <ActivityFeed
                workspaceId={workspaceId}
                taskId={taskId}
                members={membersQuery.data?.members ?? []}
              />
            </>
          )}
          {error ? (
            <p className="text-sm text-ink" role="alert">
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
          className="border border-dashed border-hairline px-2 py-0.5 text-[10px]"
        >
          {tag.name}
        </span>
      ))}
    </span>
  );
}
