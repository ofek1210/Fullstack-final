import { Schema, model, Types, InferSchemaType } from "mongoose";

const requestSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["open", "in_progress", "closed"], default: "open" },
    createdBy: { type: Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export type RequestDoc = InferSchemaType<typeof requestSchema>;
export const Request = model("Request", requestSchema);
