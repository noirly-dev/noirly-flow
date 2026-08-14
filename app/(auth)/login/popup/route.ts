import { NextRequest } from "next/server";
import { signIn } from "@/auth";

function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function GET(request: NextRequest) {
  const target = safeNext(request.nextUrl.searchParams.get("next"));
  await signIn("noirly", {
    redirectTo: `/login/popup-complete?next=${encodeURIComponent(target)}`,
  });
}
