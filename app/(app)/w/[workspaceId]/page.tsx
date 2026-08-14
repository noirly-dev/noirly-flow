import { FirstProjectRedirect } from "@/src/features/workspace/FirstProjectRedirect";

type Params = { params: Promise<{ workspaceId: string }> };

export default async function WorkspaceIndexPage({ params }: Params) {
  const { workspaceId } = await params;
  return <FirstProjectRedirect workspaceId={workspaceId} />;
}
