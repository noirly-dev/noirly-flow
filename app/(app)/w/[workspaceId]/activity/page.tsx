import { notFound, redirect } from "next/navigation";
import { WorkspaceActivityPanel } from "@/src/features/activity/WorkspaceActivityPanel";
import { ApiError, getSyncProvider } from "@/src/server/api/http";

type Params = { params: Promise<{ workspaceId: string }> };

export default async function WorkspaceActivityPage({ params }: Params) {
  const { workspaceId } = await params;
  const { sync } = await getSyncProvider();

  try {
    const workspace = await sync.getWorkspace(workspaceId);
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted">
            Audit
          </p>
          <h1 className="text-perforated mt-2 font-display text-5xl font-bold tracking-[-0.05em] uppercase">
            {workspace.name} activity
          </h1>
        </div>
        <WorkspaceActivityPanel
          workspaceId={workspace.id}
          workspaceName={workspace.name}
        />
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
