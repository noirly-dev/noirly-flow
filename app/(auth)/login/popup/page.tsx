import { signIn } from "@/auth";

export const dynamic = "force-dynamic";

function safeNext(value: string | undefined): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export default async function LoginPopupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = safeNext(next);
  await signIn("noirly", {
    redirectTo: `/login/popup-complete?next=${encodeURIComponent(target)}`,
  });
  return null;
}
