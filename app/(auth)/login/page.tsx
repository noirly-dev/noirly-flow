import type { Metadata } from "next";
import { NoirlyLoginButton } from "@/src/features/auth/NoirlyLoginButton";

export const metadata: Metadata = {
  title: "Sign in · Noirly Flow",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const redirectTo =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-2">
        <p className="font-mono text-xs tracking-[0.2em] text-[#52D3FE]">NOIRLY FLOW</p>
        <h1 className="text-2xl font-semibold tracking-tight text-[#F5F5F5]">
          Sign in
        </h1>
        <p className="text-sm text-[#A3A3A3]">
          Use your Noirly account. Google and email sign-in are handled by Noirly Identity.
        </p>
      </div>
      <div className="rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] p-6">
        <NoirlyLoginButton redirectTo={redirectTo} />
      </div>
    </main>
  );
}
