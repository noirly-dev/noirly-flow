import {
  ApiError,
  assertObjectId,
  getSyncProvider,
  jsonError,
  jsonOk,
} from "@/src/server/api/http";
import { updateTaskBodySchema } from "@/src/server/api/schemas";

type Params = { params: Promise<{ taskId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { taskId } = await params;
    await assertObjectId(taskId, "taskId");
    const { sync } = await getSyncProvider();
    const task = await sync.getTask(taskId);
    return jsonOk({ task });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { taskId } = await params;
    await assertObjectId(taskId, "taskId");
    const body = updateTaskBodySchema.safeParse(await request.json());
    if (!body.success) {
      throw new ApiError(400, "invalid_request", "Invalid task patch");
    }
    const { sync } = await getSyncProvider();
    const data = body.data;
    const task = await sync.updateTask(taskId, {
      ...data,
      checklist: data.checklist?.map((item, index) => ({
        id: item.id ?? `tmp-${index}`,
        title: item.title,
        completed: item.completed ?? false,
        position: item.position ?? (index + 1) * 1000,
      })),
    });
    return jsonOk({ task });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { taskId } = await params;
    await assertObjectId(taskId, "taskId");
    const { sync } = await getSyncProvider();
    await sync.deleteTask(taskId);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
