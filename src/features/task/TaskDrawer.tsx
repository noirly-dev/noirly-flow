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
import {
  patchCachedTask,
  restoreTaskQueries,
  snapshotTaskQueries,
  upsertCachedTask,
} from "@/src/features/task/task-cache";

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
  initialTask?: Task;
  onClose: () => void;
};

export function TaskDrawer({ workspaceId, taskId, initialTask, onClose }: Props) {
  const queryClient = useQueryClient();
  const canWrite = useCan("task.write");
  const [title, setTitle] = useState(initialTask?.title ?? "");
  const [description, setDescription] = useState(initialTask?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(initialTask?.status ?? "todo");
  const [priority, setPriority] = useState<TaskPriority>(
    initialTask?.priority ?? "none",
  );
  const [dueDate, setDueDate] = useState(isoToDateInput(initialTask?.dueAt ?? null));
  const [projectId, setProjectId] = useState<string | "">(
    initialTask?.projectId ?? "",
  );
  const [tagIds, setTagIds] = useState<string[]>(initialTask?.tagIds ?? []);
  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    initialTask?.assigneeIds ?? [],
  );
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    initialTask?.checklist ?? [],
  );
  const [newCheck, setNewCheck] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(
    initialTask?.recurrence ?? null,
  );
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState<string | null>(null);

  const taskQuery = useQuery({
    queryKey: qk.task(taskId),
    queryFn: () => api.getTask(taskId),
    initialData: initialTask ? { task: initialTask } : undefined,
    initialDataUpdatedAt: initialTask ? 0 : undefined,
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
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", workspaceId] });
      const previous = snapshotTaskQueries(queryClient, workspaceId);
      patchCachedTask(queryClient, workspaceId, taskId, patch);
      setError(null);
      return { previous };
    },
    onSuccess: (data) => {
      upsertCachedTask(queryClient, workspaceId, data.task);
    },
    onError: (err: Error, _patch, context) => {
      if (context?.previous) {
        restoreTaskQueries(queryClient, context.previous);
      }
      setError(err.message);
    },
  });

  const createSubtaskMutation = useMutation({
    mutationFn: (title: string) =>
      api.createTask(workspaceId, {
        title,
        parentTaskId: taskId,
        projectId: taskQuery.data?.task.projectId ?? null,
      }),
    onMutate: async (title) => {
      const key = ["tasks", workspaceId, { parentTaskId: taskId }] as const;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<{ tasks: Task[] }>(key);
      const now = new Date().toISOString();
      const optimistic: Task = {
        id: `tmp-${crypto.randomUUID()}`,
        workspaceId,
        projectId: taskQuery.data?.task.projectId ?? null,
        columnId: null,
        title,
        description: null,
        status: "todo",
        priority: "none",
        dueAt: null,
        startAt: null,
        completedAt: null,
        position: Date.now(),
        assigneeIds: [],
        tagIds: [],
        parentTaskId: taskId,
        recurrence: null,
        checklist: [],
        createdById: "",
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      queryClient.setQueryData<{ tasks: Task[] }>(key, {
        tasks: [...(previous?.tasks ?? []), optimistic],
      });
      setNewSubtask("");
      setError(null);
      return { previous, optimisticId: optimistic.id, key };
    },
    onSuccess: (data, _title, context) => {
      if (!context) return;
      queryClient.setQueryData<{ tasks: Task[] }>(context.key, (old) => {
        if (!old) return { tasks: [data.task] };
        return {
          tasks: old.tasks.map((task) =>
            task.id === context.optimisticId ? data.task : task,
          ),
        };
      });
    },
    onError: (err: Error, _title, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.key, context.previous);
      } else if (context?.key) {
        queryClient.setQueryData(context.key, { tasks: [] });
      }
      setError(err.message);
    },
  });

  const createTagMutation = useMutation({
    mutationFn: () => api.createTag(workspaceId, { name: newTag }),
    onSuccess: (result) => {
      setNewTag("");
      setTagIds((current) =>
        current.includes(result.tag.id) ? current : [...current, result.tag.id],
      );
      void queryClient.invalidateQueries({ queryKey: ["tags", workspaceId] });
      void saveMutation.mutate({
        tagIds: [...tagIds, result.tag.id],
      });
    },
    onError: (err: Error) => setError(err.message),
  });

  function persist(patch: Partial<Task>) {
    if (!canWrite) return;
    saveMutation.mutate(patch);
  }

  const tags = tagsQuery.data?.tags ?? [];
  const projects = projectsQuery.data?.projects ?? [];
  const subtasks = subtasksQuery.data?.tasks ?? [];
  const isSubtask = Boolean(
    (taskQuery.data?.task ?? initialTask)?.parentTaskId,
  );
  const task = taskQuery.data?.task ?? initialTask;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Close task"
        className="absolute inset-0 cursor-pointer bg-[var(--bg)]/60"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-[var(--hairline)] bg-[var(--bg)]">
        <header className="flex items-center justify-between border-b border-[var(--hairline)] px-5 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            Task
          </p>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            Close
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {!task && taskQuery.isPending ? (
            <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>
          ) : taskQuery.isError && !task ? (
            <p className="text-sm text-[var(--foreground)]">Could not load task.</p>
          ) : task ? (
            <>
              <input
                value={title}
                readOnly={!canWrite}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={() => {
                  if (title.trim()) persist({ title: title.trim() });
                }}
                className="w-full bg-transparent text-xl font-semibold text-[var(--foreground)] outline-none read-only:text-[var(--muted-foreground)]"
              />

              <textarea
                value={description}
                readOnly={!canWrite}
                onChange={(event) => setDescription(event.target.value)}
                onBlur={() => persist({ description: description.trim() || null })}
                placeholder="Add a description…"
                rows={3}
                className="w-full resize-none border border-[var(--hairline)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] read-only:text-[var(--muted-foreground)]"
              />

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1 text-xs text-[var(--muted-foreground)]">
                  Status
                  <select
                    value={status}
                    disabled={!canWrite}
                    onChange={(event) => {
                      const next = event.target.value as TaskStatus;
                      setStatus(next);
                      persist({ status: next });
                    }}
                    className="h-10 w-full border border-[var(--hairline)] bg-[var(--surface)] px-2 text-sm text-[var(--foreground)] disabled:opacity-50"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-xs text-[var(--muted-foreground)]">
                  Priority
                  <select
                    value={priority}
                    disabled={!canWrite}
                    onChange={(event) => {
                      const next = event.target.value as TaskPriority;
                      setPriority(next);
                      persist({ priority: next });
                    }}
                    className="h-10 w-full border border-[var(--hairline)] bg-[var(--surface)] px-2 text-sm text-[var(--foreground)] disabled:opacity-50"
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="col-span-2 space-y-1 text-xs text-[var(--muted-foreground)]">
                  Project
                  <select
                    value={projectId}
                    disabled={!canWrite}
                    onChange={(event) => {
                      const next = event.target.value;
                      setProjectId(next);
                      persist({ projectId: next || null });
                    }}
                    className="h-10 w-full border border-[var(--hairline)] bg-[var(--surface)] px-2 text-sm text-[var(--foreground)] disabled:opacity-50"
                  >
                    <option value="">Inbox</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="col-span-2 space-y-1 text-xs text-[var(--muted-foreground)]">
                  Due date
                  <input
                    type="date"
                    value={dueDate}
                    disabled={!canWrite}
                    onChange={(event) => {
                      setDueDate(event.target.value);
                      persist({ dueAt: dateInputToIso(event.target.value) });
                    }}
                    className="h-10 w-full border border-[var(--hairline)] bg-[var(--surface)] px-2 text-sm text-[var(--foreground)] disabled:opacity-50"
                  />
                </label>
                <label className="col-span-2 space-y-1 text-xs text-[var(--muted-foreground)]">
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
                    className="h-10 w-full border border-[var(--hairline)] bg-[var(--surface)] px-2 text-sm text-[var(--foreground)] disabled:opacity-50"
                  >
                    <option value="">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </label>
              </div>

              <section>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
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
                            ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                            : "border-[var(--hairline)] text-[var(--muted-foreground)]"
                        }`}
                      >
                        {member.displayName}
                      </button>
                    );
                  })}
                  {membersQuery.isLoading ? (
                    <span className="text-xs text-[var(--muted-foreground)]">Loading members…</span>
                  ) : null}
                </div>
              </section>

              <section>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
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
                            ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                            : "border-[var(--hairline)] text-[var(--muted-foreground)]"
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
                    className="h-9 flex-1 border border-[var(--hairline)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none"
                  />
                  <button
                    type="submit"
                    className="h-9 border border-[var(--hairline)] px-3 text-xs text-[var(--muted-foreground)]"
                  >
                    Add
                  </button>
                </form>
                ) : null}
              </section>

              <section>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
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
                            ? "text-[var(--muted-foreground)] line-through"
                            : "text-[var(--foreground)]"
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
                          className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
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
                    className="h-9 flex-1 border border-[var(--hairline)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none"
                  />
                  <button
                    type="submit"
                    className="h-9 border border-[var(--hairline)] px-3 text-xs text-[var(--muted-foreground)]"
                  >
                    Add
                  </button>
                </form>
                ) : null}
              </section>

              {!isSubtask ? (
                <section>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    Subtasks
                  </p>
                  <ul className="space-y-2">
                    {subtasks.map((subtask) => (
                      <li
                        key={subtask.id}
                        className="flex items-center gap-2 border border-[var(--hairline)] bg-[var(--surface)] px-3 py-2"
                      >
                        <input
                          type="checkbox"
                          checked={subtask.status === "done"}
                          disabled={!canWrite}
                          onChange={() => {
                            const nextStatus =
                              subtask.status === "done" ? "todo" : "done";
                            const key = [
                              "tasks",
                              workspaceId,
                              { parentTaskId: taskId },
                            ] as const;
                            queryClient.setQueryData<{ tasks: Task[] }>(
                              key,
                              (old) =>
                                old
                                  ? {
                                      tasks: old.tasks.map((item) =>
                                        item.id === subtask.id
                                          ? { ...item, status: nextStatus }
                                          : item,
                                      ),
                                    }
                                  : old,
                            );
                            void api
                              .updateTask(subtask.id, { status: nextStatus })
                              .catch((err: Error) => {
                                queryClient.setQueryData<{ tasks: Task[] }>(
                                  key,
                                  (old) =>
                                    old
                                      ? {
                                          tasks: old.tasks.map((item) =>
                                            item.id === subtask.id
                                              ? { ...item, status: subtask.status }
                                              : item,
                                          ),
                                        }
                                      : old,
                                );
                                setError(err.message);
                              });
                          }}
                        />
                        <span
                          className={`flex-1 text-sm ${
                            subtask.status === "done"
                              ? "text-[var(--muted-foreground)] line-through"
                              : "text-[var(--foreground)]"
                          }`}
                        >
                          {subtask.title}
                        </span>
                      </li>
                    ))}
                    {subtasksQuery.isLoading ? (
                      <li className="text-xs text-[var(--muted-foreground)]">Loading…</li>
                    ) : subtasks.length === 0 ? (
                      <li className="text-xs text-[var(--muted-foreground)]">No subtasks yet.</li>
                    ) : null}
                  </ul>
                  {canWrite ? (
                    <form
                      className="mt-3 flex gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (!newSubtask.trim()) return;
                        createSubtaskMutation.mutate(newSubtask.trim());
                      }}
                    >
                      <input
                        value={newSubtask}
                        onChange={(event) => setNewSubtask(event.target.value)}
                        placeholder="Add subtask"
                        className="h-9 flex-1 border border-[var(--hairline)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!newSubtask.trim()}
                        className="h-9 border border-[var(--hairline)] px-3 text-xs text-[var(--muted-foreground)] disabled:opacity-50"
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
          ) : null}
          {error ? (
            <p className="text-sm text-[var(--foreground)]" role="alert">
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
          className="border border-[var(--hairline)] px-2 py-0.5 text-[10px]"
        >
          {tag.name}
        </span>
      ))}
    </span>
  );
}
