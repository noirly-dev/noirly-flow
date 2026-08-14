import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
  type Types,
} from "mongoose";

const activityEventSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      default: null,
      index: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "FlowUser",
      required: true,
    },
    verb: { type: String, required: true, trim: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

activityEventSchema.index({ workspaceId: 1, createdAt: -1 });
activityEventSchema.index({ taskId: 1, createdAt: -1 });

export type ActivityEventDocument = InferSchemaType<
  typeof activityEventSchema
> & {
  _id: Types.ObjectId;
  createdAt: Date;
};

export const ActivityEvent: Model<ActivityEventDocument> =
  (models.ActivityEvent as Model<ActivityEventDocument>) ||
  model<ActivityEventDocument>(
    "ActivityEvent",
    activityEventSchema,
    "activity_events",
  );
