import { Types } from "mongoose";
import { ActivityEvent } from "@/src/server/models";

export async function recordActivity(input: {
  workspaceId: string | Types.ObjectId;
  projectId?: string | Types.ObjectId | null;
  taskId?: string | Types.ObjectId | null;
  actorId: string | Types.ObjectId;
  verb: string;
  metadata?: Record<string, unknown>;
}) {
  await ActivityEvent.create({
    workspaceId: new Types.ObjectId(String(input.workspaceId)),
    projectId: input.projectId
      ? new Types.ObjectId(String(input.projectId))
      : null,
    taskId: input.taskId ? new Types.ObjectId(String(input.taskId)) : null,
    actorId: new Types.ObjectId(String(input.actorId)),
    verb: input.verb,
    metadata: input.metadata ?? {},
  });
}

export function idsEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((id, index) => id === right[index]);
}
