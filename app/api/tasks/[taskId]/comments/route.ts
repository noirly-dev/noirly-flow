import {
  ApiError,
  assertObjectId,
  getSyncProvider,
  jsonError,
  jsonOk,
} from "@/src/server/api/http";
import { createCommentBodySchema } from "@/src/server/api/schemas";

type Params = { params: Promise<{ taskId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { taskId } = await params;
    await assertObjectId(taskId, "taskId");
    const { sync } = await getSyncProvider();
    const comments = await sync.listComments(taskId);
    return jsonOk({ comments });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { taskId } = await params;
    await assertObjectId(taskId, "taskId");
    const body = createCommentBodySchema.safeParse(await request.json());
    if (!body.success) {
      throw new ApiError(400, "invalid_request", "Invalid comment");
    }
    const { sync } = await getSyncProvider();
    const comment = await sync.createComment({
      taskId,
      body: body.data.body,
    });
    return jsonOk({ comment }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
