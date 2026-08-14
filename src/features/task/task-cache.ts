import type { QueryClient } from "@tanstack/react-query";
import { qk } from "@/src/core/sync/query-keys";
import type { Task } from "@/src/core/sync/types";

type TaskListCache = { tasks: Task[] };
type TaskCache = { task: Task };

export function snapshotTaskQueries(
  queryClient: QueryClient,
  workspaceId: string,
) {
  return queryClient.getQueriesData<TaskListCache>({
    queryKey: ["tasks", workspaceId],
  });
}

export function restoreTaskQueries(
  queryClient: QueryClient,
  snapshots: ReturnType<typeof snapshotTaskQueries>,
) {
  for (const [key, data] of snapshots) {
    queryClient.setQueryData(key, data);
  }
}

export function patchCachedTask(
  queryClient: QueryClient,
  workspaceId: string,
  taskId: string,
  patch: Partial<Task>,
) {
  const next = (task: Task): Task =>
    task.id === taskId
      ? { ...task, ...patch, updatedAt: new Date().toISOString() }
      : task;

  queryClient.setQueriesData<TaskListCache>(
    { queryKey: ["tasks", workspaceId] },
    (old) => (old ? { tasks: old.tasks.map(next) } : old),
  );
  queryClient.setQueryData<TaskCache>(qk.task(taskId), (old) =>
    old ? { task: next(old.task) } : old,
  );
}

export function removeCachedTask(
  queryClient: QueryClient,
  workspaceId: string,
  taskId: string,
) {
  queryClient.setQueriesData<TaskListCache>(
    { queryKey: ["tasks", workspaceId] },
    (old) =>
      old ? { tasks: old.tasks.filter((task) => task.id !== taskId) } : old,
  );
  queryClient.removeQueries({ queryKey: qk.task(taskId) });
}

export function upsertCachedTask(
  queryClient: QueryClient,
  workspaceId: string,
  task: Task,
) {
  queryClient.setQueriesData<TaskListCache>(
    { queryKey: ["tasks", workspaceId] },
    (old) => {
      if (!old) return old;
      const index = old.tasks.findIndex((item) => item.id === task.id);
      if (index < 0) return { tasks: [task, ...old.tasks] };
      const tasks = old.tasks.slice();
      tasks[index] = task;
      return { tasks };
    },
  );
  queryClient.setQueryData<TaskCache>(qk.task(task.id), { task });
}

export function seedTaskCache(queryClient: QueryClient, task: Task) {
  queryClient.setQueryData<TaskCache>(qk.task(task.id), (old) => old ?? { task });
}
