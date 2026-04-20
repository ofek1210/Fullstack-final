import { Schema, model, Types, InferSchemaType } from "mongoose";

const commentSchema = new Schema(
  {
    postId: { type: Types.ObjectId, ref: "Post", required: true, index: true },
    authorId: { type: Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export type CommentDoc = InferSchemaType<typeof commentSchema>;
export const Comment = model("Comment", commentSchema);
