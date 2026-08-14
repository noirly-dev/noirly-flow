import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
  type Types,
} from "mongoose";

const commentSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "FlowUser",
      required: true,
    },
    body: { type: String, required: true, trim: true, maxlength: 8000 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

commentSchema.index({ taskId: 1, createdAt: 1 });

export type CommentDocument = InferSchemaType<typeof commentSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Comment: Model<CommentDocument> =
  (models.Comment as Model<CommentDocument>) ||
  model<CommentDocument>("Comment", commentSchema, "comments");
