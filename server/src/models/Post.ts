import { Schema, model, Types, InferSchemaType } from "mongoose";

const postSchema = new Schema(
  {
    author: { type: Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
    imageUrl: { type: String, trim: true, default: "" },
    commentsCount: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },
    embedding: { type: [Number], default: [] },
    embeddingModel: { type: String, trim: true, default: "" },
    embeddingUpdatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export type PostDoc = InferSchemaType<typeof postSchema>;
export const Post = model("Post", postSchema);
