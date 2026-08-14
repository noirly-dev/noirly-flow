import { ActivityView } from "@/src/features/activity/ActivityView";

type Params = { params: Promise<{ workspaceId: string }> };

export default async function WorkspaceActivityPage({ params }: Params) {
  const { workspaceId } = await params;
  return <ActivityView workspaceId={workspaceId} />;
}
