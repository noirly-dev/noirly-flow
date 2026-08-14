import {
  assertObjectId,
  getSyncProvider,
  jsonError,
  jsonOk,
  ApiError,
} from "@/src/server/api/http";
import {
  createTaskBodySchema,
  listTasksQuerySchema,
} from "@/src/server/api/schemas";
import type { TaskPriority, TaskStatus } from "@/src/core/models/enums";
import { dueRange } from "@/src/features/task/dates";

type Params = { params: Promise<{ workspaceId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { workspaceId } = await params;
    await assertObjectId(workspaceId, "workspaceId");
    const url = new URL(request.url);
    const parsed = listTasksQuerySchema.safeParse({
      projectId: url.searchParams.get("projectId") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      priority: url.searchParams.get("priority") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
      due: url.searchParams.get("due") ?? undefined,
    });
    if (!parsed.success) {
      throw new ApiError(400, "invalid_request", "Invalid query");
    }

    const range = dueRange(parsed.data.due);
    const { sync } = await getSyncProvider();
    const tasks = await sync.listTasks({
      workspaceId,
      projectId: parsed.data.projectId,
      status: parsed.data.status
        ? (parsed.data.status.split(",") as TaskStatus[])
        : undefined,
      priority: parsed.data.priority
        ? (parsed.data.priority.split(",") as TaskPriority[])
        : undefined,
      search: parsed.data.search,
      ...range,
    });
    return jsonOk({ tasks });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { workspaceId } = await params;
    await assertObjectId(workspaceId, "workspaceId");
    const body = createTaskBodySchema.safeParse(await request.json());
    if (!body.success) {
      throw new ApiError(400, "invalid_request", "Invalid task payload");
    }

    const { sync } = await getSyncProvider();
    const task = await sync.createTask({
      workspaceId,
      ...body.data,
    });
    return jsonOk({ task }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
