import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SettingsView } from "@/src/features/settings/SettingsView";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const identityUrl = (
    process.env.NEXT_PUBLIC_IDENTITY_URL ??
    process.env.AUTH_NOIRLY_ISSUER ??
    ""
  ).replace(/\/$/, "");

  return (
    <SettingsView
      identityName={session.user.name || ""}
      identityEmail={session.user.email || ""}
      identityUrl={identityUrl}
    />
  );
}
