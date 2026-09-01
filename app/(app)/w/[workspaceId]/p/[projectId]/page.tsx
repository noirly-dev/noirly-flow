import { PageContainer } from "@noirly-dev/ui";
import { TaskWorkspace } from "@/src/features/task/TaskWorkspace";

type Params = { params: Promise<{ workspaceId: string; projectId: string }> };

export default async function ProjectBoardPage({ params }: Params) {
  const { workspaceId, projectId } = await params;
  return (
    <PageContainer size="lg">
      <TaskWorkspace
        workspaceId={workspaceId}
        projectId={projectId}
        projectName="Board"
      />
    </PageContainer>
  );
}
