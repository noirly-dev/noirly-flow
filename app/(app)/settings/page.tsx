import { redirect } from "next/navigation";
import { SettingsView } from "@/src/features/settings/SettingsView";
import { requireFlowSession } from "@/src/server/api/http";

export default async function SettingsPage() {
  const ctx = await requireFlowSession();

  const identityUrl = (
    process.env.NEXT_PUBLIC_IDENTITY_URL ??
    process.env.AUTH_NOIRLY_ISSUER ??
    ""
  ).replace(/\/$/, "");

  return (
    <SettingsView
      identityName={ctx.displayName}
      identityEmail={ctx.email}
      identityUrl={identityUrl}
    />
  );
}
