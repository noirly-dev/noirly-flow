import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSyncProvider } from "@/src/server/api/http";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { ctx } = await getSyncProvider();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <p className="font-mono text-xs tracking-[0.2em] text-[#52D3FE]">ACCOUNT</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-[#A3A3A3]">
          Profile data comes from Noirly Identity. Password and Google login are managed there.
        </p>
      </div>
      <dl className="grid gap-3 rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] p-5 font-mono text-xs text-[#A3A3A3]">
        <div className="flex justify-between gap-4 border-b border-[#2A2A2A] pb-3">
          <dt>Name</dt>
          <dd className="text-[#F5F5F5]">{ctx.displayName}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-[#2A2A2A] pb-3">
          <dt>Email</dt>
          <dd className="text-[#F5F5F5]">{ctx.email}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Identity sub</dt>
          <dd className="truncate text-[#F5F5F5]">{ctx.identitySub}</dd>
        </div>
      </dl>
    </main>
  );
}
