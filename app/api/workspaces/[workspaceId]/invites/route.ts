import {
  ApiError,
  assertObjectId,
  getSyncProvider,
  jsonError,
  jsonOk,
} from "@/src/server/api/http";
import { createInviteBodySchema } from "@/src/server/api/schemas";
import { createInvite } from "@/src/server/workspace/members";

type Params = { params: Promise<{ workspaceId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { workspaceId } = await params;
    await assertObjectId(workspaceId, "workspaceId");
    const body = createInviteBodySchema.safeParse(await request.json());
    if (!body.success) {
      throw new ApiError(400, "invalid_request", "Invalid invite payload");
    }
    const { ctx } = await getSyncProvider();
    const invite = await createInvite({
      workspaceId,
      userId: ctx.userId,
      role: body.data.role,
    });
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.AUTH_URL ??
      "http://localhost:3002";
    return jsonOk({
      invite: {
        ...invite,
        url: `${origin.replace(/\/$/, "")}/invite/${invite.token}`,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
