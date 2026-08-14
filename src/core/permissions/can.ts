import type { MemberRole } from "@/src/core/models/enums";

export const PERMISSIONS = [
  "workspace.view",
  "task.write",
  "project.write",
  "members.manage",
] as const;

export type PermissionAction = (typeof PERMISSIONS)[number];

const rank: Record<MemberRole, number> = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
};

const requiredRank: Record<PermissionAction, number> = {
  "workspace.view": 1,
  "task.write": 2,
  "project.write": 2,
  "members.manage": 3,
};

export function can(role: MemberRole, action: PermissionAction): boolean {
  return rank[role] >= requiredRank[action];
}

export function roleAtLeast(role: MemberRole, min: MemberRole): boolean {
  return rank[role] >= rank[min];
}
