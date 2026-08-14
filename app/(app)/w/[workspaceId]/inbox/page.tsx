import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { TaskWorkspace } from "@/src/features/task/TaskWorkspace";
import { ApiError, getSyncProvider } from "@/src/server/api/http";

type Params = { params: Promise<{ workspaceId: string }> };

export default async function WorkspaceInboxPage({ params }: Params) {
  const { workspaceId } = await params;
  const { sync } = await getSyncProvider();

  try {
    const workspace = await sync.getWorkspace(workspaceId);
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
        <Suspense
          fallback={<p className="text-sm text-muted">Loading inbox…</p>}
        >
          <TaskWorkspace
            workspaceId={workspace.id}
            projectId={null}
            projectName="Inbox"
          />
        </Suspense>
      </main>
    );
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 404 || error.status === 403)
    ) {
      notFound();
    }
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login");
    }
    throw error;
  }
}
