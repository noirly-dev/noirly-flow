import { MembersView } from "@/src/features/workspace/MembersView";

type Params = { params: Promise<{ workspaceId: string }> };

export default async function MembersPage({ params }: Params) {
  const { workspaceId } = await params;
  return <MembersView workspaceId={workspaceId} />;
}
