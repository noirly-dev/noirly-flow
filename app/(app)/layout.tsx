import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/src/components/AppShell";
import {
  listSessionWorkspaces,
  requireFlowSession,
} from "@/src/server/api/http";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [ctx, workspaces] = await Promise.all([
    requireFlowSession(),
    listSessionWorkspaces(),
  ]);

  return (
    <AppShell
      user={{ displayName: ctx.displayName, email: ctx.email }}
      initialWorkspaces={workspaces}
    >
      {children}
    </AppShell>
  );
}
