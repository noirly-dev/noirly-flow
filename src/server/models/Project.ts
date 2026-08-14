import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
  type Types,
} from "mongoose";
import { PROJECT_VIEWS } from "@/src/core/models/enums";

const projectSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    color: { type: String, default: null },
    defaultView: {
      type: String,
      enum: PROJECT_VIEWS,
      default: "board",
    },
    archivedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

projectSchema.index({ workspaceId: 1, deletedAt: 1 });

export type ProjectDocument = InferSchemaType<typeof projectSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Project: Model<ProjectDocument> =
  (models.Project as Model<ProjectDocument>) ||
  model<ProjectDocument>("Project", projectSchema, "projects");
