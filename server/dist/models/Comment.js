"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment = void 0;
const mongoose_1 = require("mongoose");
const commentSchema = new mongoose_1.Schema({
    postId: { type: mongoose_1.Types.ObjectId, ref: "Post", required: true, index: true },
    authorId: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
}, { timestamps: true });
exports.Comment = (0, mongoose_1.model)("Comment", commentSchema);
