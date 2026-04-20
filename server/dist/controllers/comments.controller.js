"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentsController = void 0;
const mongoose_1 = require("mongoose");
const Comment_1 = require("../models/Comment");
const Post_1 = require("../models/Post");
function parsePaging(req) {
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const skip = Math.max(Number(req.query.skip) || 0, 0);
    return { limit, skip };
}
function toCommentResponse(comment) {
    return {
        id: String(comment._id),
        postId: String(comment.postId),
        text: comment.text,
        createdAt: comment.createdAt,
        author: {
            userId: String(comment.authorId._id),
            username: comment.authorId.username,
            avatarUrl: comment.authorId.avatarUrl || "",
        },
    };
}
exports.commentsController = {
    async getForPost(req, res) {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: "unauthorized" });
        const postId = req.params.id;
        const { limit, skip } = parsePaging(req);
        const comments = await Comment_1.Comment.find({ postId: new mongoose_1.Types.ObjectId(postId) })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("authorId", "username avatarUrl")
            .lean()
            .exec();
        const items = comments.map(toCommentResponse);
        return res.json({
            items,
            nextSkip: skip + items.length,
            hasMore: items.length === limit,
        });
    },
    async create(req, res) {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: "unauthorized" });
        const { text } = req.body;
        if (!text || !text.trim())
            return res.status(400).json({ error: "text is required" });
        const postId = req.params.id;
        const post = await Post_1.Post.findById(postId);
        if (!post)
            return res.status(404).json({ error: "Post not found" });
        const comment = await Comment_1.Comment.create({
            postId: new mongoose_1.Types.ObjectId(postId),
            authorId: new mongoose_1.Types.ObjectId(userId),
            text: text.trim(),
        });
        await Post_1.Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });
        const populated = await Comment_1.Comment.findById(comment._id)
            .populate("authorId", "username avatarUrl")
            .lean();
        if (!populated)
            return res.status(500).json({ error: "Failed to create comment" });
        return res.status(201).json(toCommentResponse(populated));
    },
};
