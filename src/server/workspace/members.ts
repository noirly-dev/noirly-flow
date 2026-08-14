import { createHash, randomBytes } from "node:crypto";
import { Types } from "mongoose";
import { withDb } from "@/src/server/db/mongodb";
import {
  BoardColumn,
  FlowUser,
  Project,
  Workspace,
  WorkspaceInvite,
  WorkspaceMembership,
} from "@/src/server/models";
import { ApiError } from "@/src/server/api/http";
import type { MemberRole } from "@/src/core/models/enums";

function oid(id: string) {
  return new Types.ObjectId(id);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export type MemberView = {
  userId: string;
  email: string;
  displayName: string;
  role: MemberRole;
};

export async function requireWorkspaceRole(
  userId: string,
  workspaceId: string,
  min: MemberRole,
): Promise<MemberRole> {
  const membership = await WorkspaceMembership.findOne({
    workspaceId: oid(workspaceId),
    userId: oid(userId),
  }).lean();
  if (!membership) {
    throw new ApiError(403, "forbidden", "Not a member of this workspace");
  }
  const role = membership.role as MemberRole;
  const rank = { viewer: 1, member: 2, admin: 3, owner: 4 };
  if (rank[role] < rank[min]) {
    throw new ApiError(403, "forbidden", "Insufficient permissions");
  }
  return role;
}

export async function listMembers(workspaceId: string): Promise<MemberView[]> {
  const memberships = await WorkspaceMembership.find({
    workspaceId: oid(workspaceId),
  }).lean();
  const users = await FlowUser.find({
    _id: { $in: memberships.map((m) => m.userId) },
  }).lean();
  const byId = new Map(users.map((user) => [user._id.toString(), user]));
  return memberships.map((membership) => {
    const user = byId.get(membership.userId.toString());
    return {
      userId: membership.userId.toString(),
      email: user?.email ?? "",
      displayName: user?.displayName ?? "Unknown",
      role: membership.role as MemberRole,
    };
  });
}

export async function createInvite(input: {
  workspaceId: string;
  userId: string;
  role: Exclude<MemberRole, "owner">;
  days?: number;
}) {
  return withDb(async () => {
    await requireWorkspaceRole(input.userId, input.workspaceId, "admin");
    const token = randomBytes(24).toString("base64url");
    const days = input.days ?? 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    await WorkspaceInvite.create({
      workspaceId: oid(input.workspaceId),
      role: input.role,
      tokenHash: hashToken(token),
      createdById: oid(input.userId),
      expiresAt,
    });

    return { token, expiresAt: expiresAt.toISOString(), role: input.role };
  });
}

export async function acceptInvite(userId: string, token: string) {
  return withDb(async () => {
    const invite = await WorkspaceInvite.findOne({
      tokenHash: hashToken(token),
    });
    if (!invite || invite.revokedAt) {
      throw new ApiError(404, "not_found", "Invite is invalid");
    }
    if (invite.usedAt) {
      throw new ApiError(400, "invalid_request", "Invite already used");
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      throw new ApiError(400, "invalid_request", "Invite expired");
    }

    const existing = await WorkspaceMembership.findOne({
      workspaceId: invite.workspaceId,
      userId: oid(userId),
    });
    if (!existing) {
      await WorkspaceMembership.create({
        workspaceId: invite.workspaceId,
        userId: oid(userId),
        role: invite.role,
      });
    }

    invite.usedAt = new Date();
    await invite.save();

    const workspace = await Workspace.findById(invite.workspaceId).lean();
    if (!workspace) {
      throw new ApiError(404, "not_found", "Workspace not found");
    }
    return { workspaceId: workspace._id.toString(), name: workspace.name };
  });
}

export async function updateMemberRole(input: {
  actorId: string;
  workspaceId: string;
  targetUserId: string;
  role: MemberRole;
}) {
  return withDb(async () => {
    const actorRole = await requireWorkspaceRole(
      input.actorId,
      input.workspaceId,
      "admin",
    );
    if (input.role === "owner" && actorRole !== "owner") {
      throw new ApiError(403, "forbidden", "Only the owner can assign owner");
    }
    if (input.targetUserId === input.actorId && input.role !== actorRole) {
      throw new ApiError(400, "invalid_request", "You cannot change your own role");
    }

    const membership = await WorkspaceMembership.findOne({
      workspaceId: oid(input.workspaceId),
      userId: oid(input.targetUserId),
    });
    if (!membership) {
      throw new ApiError(404, "not_found", "Member not found");
    }
    if (membership.role === "owner" && input.role !== "owner") {
      const owners = await WorkspaceMembership.countDocuments({
        workspaceId: oid(input.workspaceId),
        role: "owner",
      });
      if (owners <= 1) {
        throw new ApiError(400, "invalid_request", "Keep at least one owner");
      }
    }
    membership.role = input.role;
    await membership.save();
    return { userId: input.targetUserId, role: input.role };
  });
}

export async function removeMember(input: {
  actorId: string;
  workspaceId: string;
  targetUserId: string;
}) {
  return withDb(async () => {
    await requireWorkspaceRole(input.actorId, input.workspaceId, "admin");
    const membership = await WorkspaceMembership.findOne({
      workspaceId: oid(input.workspaceId),
      userId: oid(input.targetUserId),
    });
    if (!membership) {
      throw new ApiError(404, "not_found", "Member not found");
    }
    if (membership.role === "owner") {
      const owners = await WorkspaceMembership.countDocuments({
        workspaceId: oid(input.workspaceId),
        role: "owner",
      });
      if (owners <= 1) {
        throw new ApiError(400, "invalid_request", "Keep at least one owner");
      }
    }
    await membership.deleteOne();
  });
}

export async function ensureDefaultProject(workspaceId: Types.ObjectId) {
  const existing = await Project.findOne({ workspaceId, deletedAt: null });
  if (existing) return existing;
  const project = await Project.create({
    workspaceId,
    name: "General",
    defaultView: "board",
  });
  await BoardColumn.insertMany([
    { projectId: project._id, name: "Todo", statusMapped: "todo", position: 1000 },
    {
      projectId: project._id,
      name: "In progress",
      statusMapped: "in_progress",
      position: 2000,
    },
    { projectId: project._id, name: "Done", statusMapped: "done", position: 3000 },
  ]);
  return project;
}
