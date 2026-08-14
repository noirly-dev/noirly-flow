"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { qk } from "@/src/core/sync/query-keys";
import { api } from "@/src/lib/api-client";
import type { Tag, Task } from "@/src/core/sync/types";
import type { TaskPriority, TaskStatus } from "@/src/core/models/enums";
import { TaskBoard } from "@/src/features/task/TaskBoard";
import { TaskDueBadge } from "@/src/features/task/TaskDueBadge";
import { AssigneeChips } from "@/src/features/task/AssigneeChips";
import { TagChips, TaskDrawer } from "@/src/features/task/TaskDrawer";
import type { WorkspaceMember } from "@/src/features/workspace/members";
import {
  dateInputToIso,
  isoToDateInput,
  type DuePreset,
} from "@/src/features/task/dates";

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

const DUE_FILTERS: { value: DuePreset | ""; label: string }[] = [
  { value: "", label: "Any due date" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "none", label: "No date" },
];

type Props = {
  workspaceId: string;
  projectId: string | null;
  projectName: string;
};

export function TaskWorkspace({ workspaceId, projectId, projectName }: Props) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedTaskId = searchParams.get("task");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("none");
  const [dueDate, setDueDate] = useState("");
  const [view, setView] = useState<"list" | "board">("board");
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "">("");
  const [dueFilter, setDueFilter] = useState<DuePreset | "">("");

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const filters = useMemo(
    () => ({
      projectId: projectId ?? undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      search: search || undefined,
      due: dueFilter || undefined,
    }),
    [projectId, statusFilter, priorityFilter, search, dueFilter],
  );

  const hasActiveFilters = Boolean(
    search || statusFilter || priorityFilter || dueFilter,
  );

  const tasksQuery = useQuery({
    queryKey: qk.tasks(workspaceId, filters),
    queryFn: () => api.listTasks(workspaceId, filters),
  });

  const projectQuery = useQuery({
    queryKey: projectId ? qk.project(projectId) : ["project", "none"],
    queryFn: () => api.getProject(projectId!),
    enabled: Boolean(projectId),
  });

  const tagsQuery = useQuery({
    queryKey: ["tags", workspaceId],
    queryFn: () => api.listTags(workspaceId),
  });

  const membersQuery = useQuery({
    queryKey: qk.members(workspaceId),
    queryFn: () => api.listMembers(workspaceId),
  });

  function openTask(taskId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("task", taskId);
    router.push(`${pathname}?${params.toString()}`);
  }

  function closeTask() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("task");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId] });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createTask(workspaceId, {
        title,
        projectId,
        priority,
        dueAt: dateInputToIso(dueDate),
      }),
    onSuccess: () => {
      setTitle("");
      setPriority("none");
      setDueDate("");
      setError(null);
      void invalidate();
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      taskId,
      patch,
    }: {
      taskId: string;
      patch: Partial<Task>;
    }) => api.updateTask(taskId, patch),
    onSuccess: () => void invalidate(),
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => api.deleteTask(taskId),
    onSuccess: () => void invalidate(),
    onError: (err: Error) => setError(err.message),
  });

  const reorderMutation = useMutation({
    mutationFn: (moves: Array<{
      taskId: string;
      columnId: string | null;
      position: number;
      status?: TaskStatus;
    }>) => {
      if (!projectId) {
        throw new Error("Project is required to reorder");
      }
      return api.reorderTasks(projectId, moves);
    },
    onMutate: async (moves) => {
      await queryClient.cancelQueries({ queryKey: qk.tasks(workspaceId, filters) });
      const previous = queryClient.getQueryData<{ tasks: Task[] }>(
        qk.tasks(workspaceId, filters),
      );
      if (previous) {
        const byId = new Map(moves.map((move) => [move.taskId, move]));
        queryClient.setQueryData<{ tasks: Task[] }>(
          qk.tasks(workspaceId, filters),
          {
            tasks: previous.tasks.map((task) => {
              const move = byId.get(task.id);
              if (!move) return task;
              return {
                ...task,
                columnId: move.columnId,
                position: move.position,
                status: move.status ?? task.status,
                completedAt:
                  move.status === "done"
                    ? task.completedAt ?? new Date().toISOString()
                    : move.status
                      ? null
                      : task.completedAt,
              };
            }),
          },
        );
      }
      return { previous };
    },
    onError: (err: Error, _moves, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          qk.tasks(workspaceId, filters),
          context.previous,
        );
      }
      setError(err.message);
    },
    onSettled: () => void invalidate(),
  });

  const tasks = tasksQuery.data?.tasks ?? [];
  const openCount = tasks.filter(
    (t) => t.status !== "done" && t.status !== "canceled",
  ).length;

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-[#52D3FE]">
            {projectName.toUpperCase()}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Tasks</h2>
          <p className="mt-1 text-sm text-[#A3A3A3]">
            {openCount} open · {tasks.length} shown
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded-md px-3 py-1.5 text-sm ${
              view === "list"
                ? "bg-[#52D3FE] text-[#121212]"
                : "border border-[#2A2A2A] text-[#A3A3A3] hover:text-[#F5F5F5]"
            }`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setView("board")}
            className={`rounded-md px-3 py-1.5 text-sm ${
              view === "board"
                ? "bg-[#52D3FE] text-[#121212]"
                : "border border-[#2A2A2A] text-[#A3A3A3] hover:text-[#F5F5F5]"
            }`}
          >
            Board
          </button>
        </div>
      </header>

      <form
        className="flex flex-col gap-3 rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] p-4 lg:flex-row lg:items-center"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          createMutation.mutate();
        }}
      >
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a task…"
          className="h-11 flex-1 rounded-lg border border-[#2A2A2A] bg-[#121212] px-3 text-sm text-[#F5F5F5] outline-none placeholder:text-[#737373] focus:border-[#52D3FE]"
        />
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value as TaskPriority)}
          className="h-11 rounded-lg border border-[#2A2A2A] bg-[#121212] px-3 text-sm text-[#F5F5F5]"
        >
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className="h-11 rounded-lg border border-[#2A2A2A] bg-[#121212] px-3 text-sm text-[#F5F5F5]"
        />
        <button
          type="submit"
          disabled={createMutation.isPending || !title.trim()}
          className="h-11 rounded-lg bg-[#52D3FE] px-4 text-sm font-semibold text-[#121212] disabled:opacity-50"
        >
          Add
        </button>
      </form>

      <div className="flex flex-col gap-3 rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] p-4 lg:flex-row lg:items-center">
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search tasks…"
          className="h-10 flex-1 rounded-lg border border-[#2A2A2A] bg-[#121212] px-3 text-sm text-[#F5F5F5] outline-none placeholder:text-[#737373] focus:border-[#52D3FE]"
        />
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as TaskStatus | "")
          }
          className="h-10 rounded-lg border border-[#2A2A2A] bg-[#121212] px-3 text-sm text-[#F5F5F5]"
        >
          <option value="">Any status</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(event) =>
            setPriorityFilter(event.target.value as TaskPriority | "")
          }
          className="h-10 rounded-lg border border-[#2A2A2A] bg-[#121212] px-3 text-sm text-[#F5F5F5]"
        >
          <option value="">Any priority</option>
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={dueFilter}
          onChange={(event) =>
            setDueFilter(event.target.value as DuePreset | "")
          }
          className="h-10 rounded-lg border border-[#2A2A2A] bg-[#121212] px-3 text-sm text-[#F5F5F5]"
        >
          {DUE_FILTERS.map((option) => (
            <option key={option.value || "any"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              setSearch("");
              setStatusFilter("");
              setPriorityFilter("");
              setDueFilter("");
            }}
            className="h-10 rounded-lg border border-[#2A2A2A] px-3 text-sm text-[#A3A3A3] hover:text-[#F5F5F5]"
          >
            Clear
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-[#D9A759]" role="alert">
          {error}
        </p>
      ) : null}

      {tasksQuery.isLoading ? (
        <p className="text-sm text-[#A3A3A3]">Loading tasks…</p>
      ) : tasksQuery.isError ? (
        <p className="text-sm text-[#D9A759]">Could not load tasks.</p>
      ) : view === "list" ? (
        <TaskList
          tasks={tasks}
          tags={tagsQuery.data?.tags ?? []}
          members={membersQuery.data?.members ?? []}
          onOpenTask={openTask}
          onStatusChange={(taskId, status) =>
            updateMutation.mutate({ taskId, patch: { status } })
          }
          onPriorityChange={(taskId, next) =>
            updateMutation.mutate({ taskId, patch: { priority: next } })
          }
          onDueChange={(taskId, dueAt) =>
            updateMutation.mutate({ taskId, patch: { dueAt } })
          }
          onDelete={(taskId) => deleteMutation.mutate(taskId)}
        />
      ) : !projectId ? (
        <p className="text-sm text-[#D9A759]">No project available for board.</p>
      ) : (
        <TaskBoard
          projectId={projectId}
          tasks={tasks}
          columns={projectQuery.data?.project.columns}
          members={membersQuery.data?.members ?? []}
          onReorder={async (moves) => {
            await reorderMutation.mutateAsync(moves);
          }}
          onDelete={(taskId) => deleteMutation.mutate(taskId)}
          onOpenTask={openTask}
        />
      )}
      {selectedTaskId ? (
        <TaskDrawer
          workspaceId={workspaceId}
          taskId={selectedTaskId}
          onClose={closeTask}
        />
      ) : null}
    </section>
  );
}

function TaskList({
  tasks,
  tags,
  members,
  onOpenTask,
  onStatusChange,
  onPriorityChange,
  onDueChange,
  onDelete,
}: {
  tasks: Task[];
  tags: Tag[];
  members: WorkspaceMember[];
  onOpenTask: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onPriorityChange: (taskId: string, priority: TaskPriority) => void;
  onDueChange: (taskId: string, dueAt: string | null) => void;
  onDelete: (taskId: string) => void;
}) {
  if (tasks.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[#2A2A2A] px-4 py-10 text-center text-sm text-[#A3A3A3]">
        No matching tasks.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[#2A2A2A] rounded-xl border border-[#2A2A2A] bg-[#1E1E1E]">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => onOpenTask(task.id)}
              className={`truncate text-left text-sm ${
                task.status === "done" || task.status === "canceled"
                  ? "text-[#737373] line-through"
                  : "text-[#F5F5F5] hover:text-[#52D3FE]"
              }`}
            >
              {task.title}
            </button>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="font-mono text-[11px] uppercase tracking-wide text-[#737373]">
                {task.priority === "none" ? "no priority" : task.priority}
              </p>
              <TaskDueBadge dueAt={task.dueAt} />
              <TagChips tagIds={task.tagIds} tags={tags} />
              <AssigneeChips assigneeIds={task.assigneeIds} members={members} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={task.status}
              onChange={(event) =>
                onStatusChange(task.id, event.target.value as TaskStatus)
              }
              className="h-9 rounded-md border border-[#2A2A2A] bg-[#121212] px-2 text-xs text-[#F5F5F5]"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={task.priority}
              onChange={(event) =>
                onPriorityChange(task.id, event.target.value as TaskPriority)
              }
              className="h-9 rounded-md border border-[#2A2A2A] bg-[#121212] px-2 text-xs text-[#F5F5F5]"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={isoToDateInput(task.dueAt)}
              onChange={(event) =>
                onDueChange(task.id, dateInputToIso(event.target.value))
              }
              className="h-9 rounded-md border border-[#2A2A2A] bg-[#121212] px-2 text-xs text-[#F5F5F5]"
            />
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="h-9 rounded-md border border-[#2A2A2A] px-3 text-xs text-[#A3A3A3] hover:border-[#D9A759] hover:text-[#D9A759]"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
