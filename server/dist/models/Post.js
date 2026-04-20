"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Post = void 0;
const mongoose_1 = require("mongoose");
const postSchema = new mongoose_1.Schema({
    author: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
    imageUrl: { type: String, trim: true, default: "" },
    commentsCount: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },
    embedding: { type: [Number], default: [] },
    embeddingModel: { type: String, trim: true, default: "" },
    embeddingUpdatedAt: { type: Date, default: null },
}, { timestamps: true });
exports.Post = (0, mongoose_1.model)("Post", postSchema);
