import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ensureFlowAccount } from "@/src/server/auth/bootstrap";

export default async function InboxRedirectPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const account = await ensureFlowAccount({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  redirect(`/w/${account.personalWorkspace.id}/inbox`);
}
