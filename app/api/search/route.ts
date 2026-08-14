import { getSyncProvider, jsonError, jsonOk } from "@/src/server/api/http";
import { searchWorkspaceContent } from "@/src/server/search";

export async function GET(request: Request) {
  try {
    const { ctx } = await getSyncProvider();
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";
    const result = await searchWorkspaceContent(ctx.userId, q);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
