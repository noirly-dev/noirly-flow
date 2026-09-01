import { PageContainer } from "@noirly-dev/ui";
import { TaskWorkspace } from "@/src/features/task/TaskWorkspace";

type Params = { params: Promise<{ workspaceId: string }> };

export default async function WorkspaceInboxPage({ params }: Params) {
  const { workspaceId } = await params;
  return (
    <PageContainer size="lg">
      <TaskWorkspace
        workspaceId={workspaceId}
        projectId={null}
        projectName="Inbox"
      />
    </PageContainer>
  );
}
