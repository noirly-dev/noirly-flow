import {
  ApiError,
  jsonError,
  jsonOk,
  requireFlowSession,
} from "@/src/server/api/http";
import { withDb } from "@/src/server/db/mongodb";
import { Project, WorkspaceMembership } from "@/src/server/models";
import { signRealtimeJwt } from "@/src/server/realtime/jwt";
import { Types } from "mongoose";

export async function GET(request: Request) {
  try {
    const ctx = await requireFlowSession();
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get("workspaceId");
    const projectId = url.searchParams.get("projectId");
    if (!workspaceId || !Types.ObjectId.isValid(workspaceId)) {
      throw new ApiError(400, "invalid_request", "workspaceId is required");
    }

    const caps = await withDb(async () => {
      const membership = await WorkspaceMembership.findOne({
        workspaceId: new Types.ObjectId(workspaceId),
        userId: new Types.ObjectId(ctx.userId),
      }).lean();
      if (!membership) {
        throw new ApiError(403, "forbidden", "Not a member of this workspace");
      }

      if (projectId) {
        if (!Types.ObjectId.isValid(projectId)) {
          throw new ApiError(400, "invalid_request", "Invalid projectId");
        }
        const project = await Project.findOne({
          _id: new Types.ObjectId(projectId),
          workspaceId: new Types.ObjectId(workspaceId),
          deletedAt: null,
        }).lean();
        if (!project) {
          throw new ApiError(404, "not_found", "Project not found");
        }
      }

      const projects = await Project.find({
        workspaceId: new Types.ObjectId(workspaceId),
        deletedAt: null,
      })
        .select("_id")
        .lean();

      const next: Record<string, Array<"subscribe" | "publish" | "presence">> = {
        [`workspace:${workspaceId}`]: ["subscribe"],
      };
      for (const project of projects) {
        next[`project:${project._id.toString()}`] = ["subscribe", "presence"];
      }
      return next;
    });

    const { token, expiresIn } = await signRealtimeJwt({
      userId: ctx.userId,
      name: ctx.displayName,
      caps,
    });

    return jsonOk({
      token,
      expiresIn,
      url: process.env.NEXT_PUBLIC_REALTIME_WS_URL ?? null,
    });
  } catch (error) {
    return jsonError(error);
  }
}
