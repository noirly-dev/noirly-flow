import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/src/components/AppShell";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <AppShell
      user={{
        displayName: session.user.name || "You",
        email: session.user.email ?? "",
      }}
    >
      {children}
    </AppShell>
  );
}
