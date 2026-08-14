import { notFound, redirect } from "next/navigation";
import { ApiError, getSyncProvider } from "@/src/server/api/http";

type Params = { params: Promise<{ workspaceId: string }> };

export default async function WorkspaceIndexPage({ params }: Params) {
  const { workspaceId } = await params;
  const { sync } = await getSyncProvider();

  try {
    const projects = await sync.listProjects(workspaceId);
    const project = projects[0];
    if (!project) {
      return (
        <main className="mx-auto flex w-full max-w-lg flex-col gap-3 px-6 py-16">
          <h1 className="text-2xl font-semibold tracking-tight">No projects yet</h1>
          <p className="text-sm text-[#A3A3A3]">
            Create a project in the sidebar to start a board.
          </p>
        </main>
      );
    }
    redirect(`/w/${workspaceId}/p/${project.id}`);
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
