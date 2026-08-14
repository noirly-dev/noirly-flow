import { notFound, redirect } from "next/navigation";
import { MembersPanel } from "@/src/features/workspace/MembersPanel";
import { ApiError, getSyncProvider } from "@/src/server/api/http";
import { can } from "@/src/core/permissions/can";

type Params = { params: Promise<{ workspaceId: string }> };

export default async function MembersPage({ params }: Params) {
  const { workspaceId } = await params;
  const { ctx, sync } = await getSyncProvider();

  try {
    const workspace = await sync.getWorkspace(workspaceId);
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted">
            Team
          </p>
          <h1 className="text-perforated mt-2 font-display text-5xl font-bold tracking-[-0.05em] uppercase">
            {workspace.name} members
          </h1>
          <p className="mt-2 text-sm text-muted">
            Roles: owner, admin, member, viewer. Viewers cannot edit tasks.
          </p>
        </div>
        <MembersPanel
          workspaceId={workspace.id}
          currentUserId={ctx.userId}
          canManage={can(workspace.role, "members.manage")}
        />
      </main>
    );
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
      notFound();
    }
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login");
    }
    throw error;
  }
}
