import { signIn } from "@/auth";

export function NoirlyLoginButton({ redirectTo = "/" }: { redirectTo?: string }) {
  const target = redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/";

  return (
    <form
      action={async () => {
        "use server";
        await signIn("noirly", { redirectTo: target });
      }}
    >
      <button
        className="flex h-12 w-full items-center justify-center rounded-lg bg-[#52D3FE] px-5 text-sm font-semibold text-[#121212] transition-colors hover:bg-[#7adefe]"
        type="submit"
      >
        Noirly Login
      </button>
    </form>
  );
}
