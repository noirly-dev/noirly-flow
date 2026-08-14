import { ApiError, getSyncProvider, jsonError, jsonOk } from "@/src/server/api/http";
import { acceptInviteBodySchema } from "@/src/server/api/schemas";
import { acceptInvite } from "@/src/server/workspace/members";

export async function POST(request: Request) {
  try {
    const body = acceptInviteBodySchema.safeParse(await request.json());
    if (!body.success) {
      throw new ApiError(400, "invalid_request", "Invalid invite token");
    }
    const { ctx } = await getSyncProvider();
    const result = await acceptInvite(ctx.userId, body.data.token);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
