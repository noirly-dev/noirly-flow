import { WorkspaceShell } from "@/src/features/workspace/WorkspaceShell";

type Params = { params: Promise<{ workspaceId: string }> };

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params["params"];
}) {
  const { workspaceId } = await params;
  return (
    <WorkspaceShell workspaceId={workspaceId}>{children}</WorkspaceShell>
  );
}
