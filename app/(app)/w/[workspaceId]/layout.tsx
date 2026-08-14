import { notFound, redirect } from "next/navigation";
import { ProjectNav } from "@/src/features/workspace/ProjectNav";
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
    await sync.getWorkspace(workspaceId);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
      notFound();
    }
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login");
    }
    throw error;
  }

  return (
    <div className="flex min-h-full min-w-0 flex-1">
      <div className="hidden w-52 shrink-0 border-r border-[#2A2A2A] p-3 lg:block">
        <ProjectNav workspaceId={workspaceId} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="border-b border-[#2A2A2A] px-4 py-3 lg:hidden">
          <ProjectNav workspaceId={workspaceId} />
        </div>
        {children}
      </div>
    </div>
  );
}
