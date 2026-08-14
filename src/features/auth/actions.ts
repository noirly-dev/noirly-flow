"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";

function isAuthCookie(name: string) {
  return /^(authjs\.|__Secure-authjs\.|__Host-authjs\.|next-auth\.|__Secure-next-auth\.)/.test(
    name,
  );
}

export async function signOutAction() {
  try {
    await signOut({ redirect: false });
  } catch {
    /* Auth.js may throw NEXT_REDIRECT; cookies still need a sweep. */
  }

  const jar = await cookies();
  for (const cookie of jar.getAll()) {
    if (!isAuthCookie(cookie.name)) continue;
    jar.set(cookie.name, "", { path: "/", maxAge: 0 });
    jar.delete(cookie.name);
  }

  redirect("/login");
}
