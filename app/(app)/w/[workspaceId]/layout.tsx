import { notFound, redirect } from "next/navigation";
import { ProjectNav } from "@/src/features/workspace/ProjectNav";
import { WorkspaceRoleProvider } from "@/src/features/workspace/WorkspaceRoleContext";
import { ApiError, getSyncProvider } from "@/src/server/api/http";

type Params = { params: Promise<{ workspaceId: string }> };

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params["params"];
}) {
  const { workspaceId } = await params;
  const { sync } = await getSyncProvider();

  try {
    const workspace = await sync.getWorkspace(workspaceId);
    return (
      <WorkspaceRoleProvider role={workspace.role}>
        <div className="flex min-h-full min-w-0 flex-1">
          <div className="hidden w-52 shrink-0 border-r border-dashed border-hairline p-3 lg:block">
            <ProjectNav workspaceId={workspaceId} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="border-b border-dashed border-hairline px-4 py-3 lg:hidden">
              <ProjectNav workspaceId={workspaceId} />
            </div>
            {children}
          </div>
        </div>
      </WorkspaceRoleProvider>
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
