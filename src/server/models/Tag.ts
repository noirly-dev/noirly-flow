import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
  type Types,
} from "mongoose";

const tagSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: "#52D3FE" },
  },
  { timestamps: true },
);

tagSchema.index({ workspaceId: 1, name: 1 }, { unique: true });

export type TagDocument = InferSchemaType<typeof tagSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Tag: Model<TagDocument> =
  (models.Tag as Model<TagDocument>) ||
  model<TagDocument>("Tag", tagSchema, "tags");
