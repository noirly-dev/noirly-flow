import { cache } from "react";
import { ApiError, getSyncProvider } from "@/src/server/api/http";

/** Personal redirects only need the workspace id from the cached bootstrap. */
export const requirePersonalWorkspace = cache(async () => {
  const { ctx, sync, personal } = await getSyncProvider();
  if (!personal) {
    throw new ApiError(404, "not_found", "Personal workspace missing");
  }
  return { ctx, sync, personal };
});
