"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likesController = void 0;
const mongodb_1 = require("mongodb");
const mongoose_1 = require("mongoose");
const Like_1 = require("../models/Like");
const Post_1 = require("../models/Post");
exports.likesController = {
    async like(req, res) {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: "unauthorized" });
        const postId = req.params.id;
        const post = await Post_1.Post.findById(postId);
        if (!post)
            return res.status(404).json({ error: "Post not found" });
        try {
            await Like_1.Like.create({
                postId: new mongoose_1.Types.ObjectId(postId),
                userId: new mongoose_1.Types.ObjectId(userId),
            });
            await Post_1.Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });
        }
        catch (err) {
            if (!(err instanceof mongodb_1.MongoServerError && err.code === 11000)) {
                return res.status(500).json({ error: "Failed to like post" });
            }
        }
        const updated = await Post_1.Post.findById(postId).lean();
        return res.json({
            likesCount: updated?.likesCount ?? post.likesCount,
            likedByMe: true,
        });
    },
    async unlike(req, res) {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: "unauthorized" });
        const postId = req.params.id;
        const post = await Post_1.Post.findById(postId);
        if (!post)
            return res.status(404).json({ error: "Post not found" });
        const removed = await Like_1.Like.findOneAndDelete({
            postId: new mongoose_1.Types.ObjectId(postId),
            userId: new mongoose_1.Types.ObjectId(userId),
        });
        if (removed) {
            await Post_1.Post.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } });
        }
        const updated = await Post_1.Post.findById(postId).lean();
        return res.json({
            likesCount: Math.max(updated?.likesCount ?? post.likesCount, 0),
            likedByMe: false,
        });
    },
};
