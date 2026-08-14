import {
  assertObjectId,
  getSyncProvider,
  jsonError,
  jsonOk,
} from "@/src/server/api/http";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { projectId } = await params;
    await assertObjectId(projectId, "projectId");
    const { sync } = await getSyncProvider();
    const project = await sync.getProject(projectId);
    return jsonOk({ project });
  } catch (error) {
    return jsonError(error);
  }
}
