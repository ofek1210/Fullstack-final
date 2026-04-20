import { Schema, model, InferSchemaType, type HydratedDocument } from "mongoose";

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    avatarUrl: { type: String, trim: true, default: "" },
    birthDate: { type: Date, default: null },
    gender: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    bio: { type: String, trim: true, default: "" },
    oauthProvider: { type: String, trim: true, default: "" },
    oauthId: { type: String, trim: true, default: "" },
    // store issued refresh tokens (one per device/session). In production you may want to hash these.
    refreshTokens: { type: [String], default: [] }
  },
  { timestamps: true }
);

export type UserDoc = HydratedDocument<InferSchemaType<typeof userSchema>>;
export const User = model("User", userSchema);
