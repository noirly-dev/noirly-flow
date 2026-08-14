import { getSyncProvider, jsonError, jsonOk } from "@/src/server/api/http";

export async function GET() {
  try {
    const { ctx } = await getSyncProvider();
    return jsonOk({
      user: {
        id: ctx.userId,
        email: ctx.email,
        displayName: ctx.displayName,
        identitySub: ctx.identitySub,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
