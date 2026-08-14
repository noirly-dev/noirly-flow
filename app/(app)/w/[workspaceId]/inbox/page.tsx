import { TaskWorkspace } from "@/src/features/task/TaskWorkspace";

type Params = { params: Promise<{ workspaceId: string }> };

export default async function WorkspaceInboxPage({ params }: Params) {
  const { workspaceId } = await params;
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <TaskWorkspace
        workspaceId={workspaceId}
        projectId={null}
        projectName="Inbox"
      />
    </main>
  );
}
