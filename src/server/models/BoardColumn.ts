import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
  type Types,
} from "mongoose";
import { TASK_STATUSES } from "@/src/core/models/enums";

const boardColumnSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    statusMapped: {
      type: String,
      enum: TASK_STATUSES,
      default: null,
    },
    position: { type: Number, required: true },
  },
  { timestamps: true },
);

boardColumnSchema.index({ projectId: 1, position: 1 });

export type BoardColumnDocument = InferSchemaType<typeof boardColumnSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const BoardColumn: Model<BoardColumnDocument> =
  (models.BoardColumn as Model<BoardColumnDocument>) ||
  model<BoardColumnDocument>("BoardColumn", boardColumnSchema, "board_columns");
