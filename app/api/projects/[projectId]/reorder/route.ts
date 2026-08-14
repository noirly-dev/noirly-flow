import {
  ApiError,
  assertObjectId,
  getSyncProvider,
  jsonError,
  jsonOk,
} from "@/src/server/api/http";
import { reorderTasksBodySchema } from "@/src/server/api/schemas";
import { publishRealtime } from "@/src/server/realtime/publish";

type Params = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    await assertObjectId(projectId, "projectId");
    const body = reorderTasksBodySchema.safeParse(await request.json());
    if (!body.success) {
      throw new ApiError(400, "invalid_request", "Invalid reorder payload");
    }

    const { sync } = await getSyncProvider();
    const tasks = await sync.reorderTasks({
      projectId,
      moves: body.data.moves,
    });
    void publishRealtime({
      channel: `project:${projectId}`,
      event: "tasks.reordered",
      data: {
        projectId,
        moves: body.data.moves,
        tasks,
        version: Date.now(),
      },
    });
    return jsonOk({ tasks });
  } catch (error) {
    return jsonError(error);
  }
}
