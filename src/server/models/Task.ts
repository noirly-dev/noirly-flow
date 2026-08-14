import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
  type Types,
} from "mongoose";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/src/core/models/enums";

const checklistItemSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    position: { type: Number, required: true },
  },
  { _id: true },
);

const recurrenceSchema = new Schema(
  {
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly", "custom"],
      required: true,
    },
    interval: { type: Number, default: 1 },
    byWeekday: { type: [Number], default: undefined },
    until: { type: Date, default: null },
    count: { type: Number, default: null },
    rrule: { type: String, default: null },
  },
  { _id: false },
);

const taskSchema = new Schema(
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
      index: true,
    },
    columnId: {
      type: Schema.Types.ObjectId,
      ref: "BoardColumn",
      default: null,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: "todo",
      index: true,
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: "none",
    },
    dueAt: { type: Date, default: null },
    startAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    position: { type: Number, required: true, default: 0 },
    assigneeIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "FlowUser" }],
      default: [],
    },
    tagIds: {
      type: [{ type: Schema.Types.ObjectId }],
      default: [],
    },
    parentTaskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      default: null,
      index: true,
    },
    recurrence: { type: recurrenceSchema, default: null },
    checklist: { type: [checklistItemSchema], default: [] },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: "FlowUser",
      required: true,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

taskSchema.index({ workspaceId: 1, deletedAt: 1 });
taskSchema.index({ projectId: 1, columnId: 1, position: 1 });

export type TaskDocument = InferSchemaType<typeof taskSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Task: Model<TaskDocument> =
  (models.Task as Model<TaskDocument>) ||
  model<TaskDocument>("Task", taskSchema, "tasks");
