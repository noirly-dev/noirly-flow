import { TaskWorkspace } from "@/src/features/task/TaskWorkspace";

type Params = { params: Promise<{ workspaceId: string; projectId: string }> };

export default async function ProjectBoardPage({ params }: Params) {
  const { workspaceId, projectId } = await params;
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <TaskWorkspace
        workspaceId={workspaceId}
        projectId={projectId}
        projectName="Board"
      />
    </main>
  );
}
