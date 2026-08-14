import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted">
          Account
        </p>
        <h1 className="text-perforated mt-2 font-display text-5xl font-bold tracking-[-0.05em] uppercase">
          Settings
        </h1>
        <p className="mt-2 text-sm text-muted">
          Profile data comes from Noirly Identity. Password and Google login are managed there.
        </p>
      </div>
      <dl className="grid gap-3 border border-dashed border-hairline bg-surface p-5 font-mono text-xs text-muted">
        <div className="flex justify-between gap-4 border-b border-dashed border-hairline pb-3">
          <dt>Name</dt>
          <dd className="text-ink">{session.user.name || "—"}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-dashed border-hairline pb-3">
          <dt>Email</dt>
          <dd className="text-ink">{session.user.email || "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Identity sub</dt>
          <dd className="truncate text-ink">{session.user.id}</dd>
        </div>
      </dl>
    </main>
  );
}
