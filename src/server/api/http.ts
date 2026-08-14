import { Types } from "mongoose";
import { auth } from "@/auth";
import { ensureFlowAccount } from "@/src/server/auth/bootstrap";
import { withDb } from "@/src/server/db/mongodb";
import { FlowUser } from "@/src/server/models";
import { createMongoSyncProvider } from "@/src/server/providers/mongo-sync-provider";

export type FlowSessionContext = {
  identitySub: string;
  userId: string;
  email: string;
  displayName: string;
};

export async function requireFlowSession(): Promise<FlowSessionContext> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ApiError(401, "unauthorized", "Sign in required");
  }

  const account = await ensureFlowAccount({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  return {
    identitySub: account.user.identitySub,
    userId: account.user.id,
    email: account.user.email,
    displayName: account.user.displayName,
  };
}

export async function getSyncProvider() {
  const ctx = await requireFlowSession();
  return {
    ctx,
    sync: createMongoSyncProvider({ userId: ctx.userId }),
  };
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function jsonOk<T>(data: T, status = 200) {
  return Response.json(data, { status });
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json(
      { error: error.code, message: error.message },
      { status: error.status },
    );
  }
  console.error(error);
  return Response.json(
    { error: "internal_error", message: "Something went wrong" },
    { status: 500 },
  );
}

export async function assertObjectId(id: string, label = "id") {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "invalid_request", `Invalid ${label}`);
  }
}

/** Resolve Flow user ObjectId; used by provider. */
export async function findFlowUserIdByIdentitySub(identitySub: string) {
  return withDb(async () => {
    const user = await FlowUser.findOne({ identitySub }).lean();
    return user?._id.toString() ?? null;
  });
}
