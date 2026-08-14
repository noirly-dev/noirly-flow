import {
  assertObjectId,
  getSyncProvider,
  jsonError,
  jsonOk,
} from "@/src/server/api/http";

type Params = { params: Promise<{ workspaceId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { workspaceId } = await params;
    await assertObjectId(workspaceId, "workspaceId");
    const { sync } = await getSyncProvider();
    const [workspace, projects] = await Promise.all([
      sync.getWorkspace(workspaceId),
      sync.listProjects(workspaceId),
    ]);
    return jsonOk({ workspace, projects });
  } catch (error) {
    return jsonError(error);
  }
}
