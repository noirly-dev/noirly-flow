import { redirect } from "next/navigation";
import { requirePersonalWorkspace } from "@/src/server/api/personal";

export default async function InboxRedirectPage() {
  const { personal } = await requirePersonalWorkspace();
  redirect(`/w/${personal.id}/inbox`);
}
