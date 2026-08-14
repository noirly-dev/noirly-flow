import {
  assertObjectId,
  getSyncProvider,
  jsonError,
  jsonOk,
} from "@/src/server/api/http";

type Params = { params: Promise<{ workspaceId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { workspaceId } = await params;
    await assertObjectId(workspaceId, "workspaceId");
    const url = new URL(request.url);
    const taskId = url.searchParams.get("taskId") ?? undefined;
    const cursor = url.searchParams.get("cursor") ?? undefined;
    if (taskId) await assertObjectId(taskId, "taskId");
    if (cursor) await assertObjectId(cursor, "cursor");
    const { sync } = await getSyncProvider();
    const result = await sync.listActivity({
      workspaceId,
      taskId,
      cursor,
    });
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
