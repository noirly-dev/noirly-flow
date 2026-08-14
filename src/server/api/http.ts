import { cache } from "react";
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

export const requireFlowSession = cache(async (): Promise<FlowSessionContext> => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ApiError(401, "unauthorized", "Sign in required");
  }

  const identitySub = session.user.id;
  const existing = await withDb(async () =>
    FlowUser.findOne({ identitySub }).lean(),
  );

  if (existing) {
    return {
      identitySub: existing.identitySub,
      userId: existing._id.toString(),
      email: existing.email,
      displayName: existing.displayName,
    };
  }

  const account = await ensureFlowAccount({
    id: identitySub,
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
});

export const getSyncProvider = cache(async () => {
  const ctx = await requireFlowSession();
  return {
    ctx,
    sync: createMongoSyncProvider({ userId: ctx.userId }),
  };
});

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
