"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postsController = void 0;
const mongoose_1 = require("mongoose");
const Post_1 = require("../models/Post");
const Like_1 = require("../models/Like");
const Comment_1 = require("../models/Comment");
const uploads_1 = require("../lib/uploads");
const localEmbedding_provider_1 = require("../services/ai/localEmbedding.provider");
async function buildEmbeddingFields(text) {
    try {
        const embedding = await (0, localEmbedding_provider_1.generateEmbedding)(text);
        return {
            embedding,
            embeddingModel: (0, localEmbedding_provider_1.getEmbeddingModelName)(),
            embeddingUpdatedAt: new Date(),
        };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Failed to generate embedding";
        console.error("Embedding generation failed", { message });
        return {};
    }
}
function parsePaging(req) {
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const skip = Math.max(Number(req.query.skip) || 0, 0);
    return { limit, skip };
}
function toPostResponse(post, likedByMe) {
    return {
        id: String(post._id),
        text: post.text,
        imageUrl: post.imageUrl,
        commentsCount: post.commentsCount,
        likesCount: post.likesCount,
        likedByMe,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: {
            userId: String(post.author._id),
            username: post.author.username,
            avatarUrl: post.author.avatarUrl || "",
        },
    };
}
exports.postsController = {
    async getAll(req, res) {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: "unauthorized" });
        const { limit, skip } = parsePaging(req);
        const posts = await Post_1.Post.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("author", "username avatarUrl")
            .lean()
            .exec();
        const postIds = posts.map((post) => post._id);
        const liked = await Like_1.Like.find({
            userId: new mongoose_1.Types.ObjectId(userId),
            postId: { $in: postIds },
        })
            .select("postId")
            .lean();
        const likedSet = new Set(liked.map((item) => String(item.postId)));
        const items = posts.map((post) => toPostResponse(post, likedSet.has(String(post._id))));
        return res.json({
            items,
            nextSkip: skip + items.length,
            hasMore: items.length === limit,
        });
    },
    async getMine(req, res) {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: "unauthorized" });
        const { limit, skip } = parsePaging(req);
        const posts = await Post_1.Post.find({ author: new mongoose_1.Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("author", "username avatarUrl")
            .lean()
            .exec();
        const postIds = posts.map((post) => post._id);
        const liked = await Like_1.Like.find({
            userId: new mongoose_1.Types.ObjectId(userId),
            postId: { $in: postIds },
        })
            .select("postId")
            .lean();
        const likedSet = new Set(liked.map((item) => String(item.postId)));
        const items = posts.map((post) => toPostResponse(post, likedSet.has(String(post._id))));
        return res.json({
            items,
            nextSkip: skip + items.length,
            hasMore: items.length === limit,
        });
    },
    async getByAuthor(req, res) {
        const viewerId = req.user?.userId;
        if (!viewerId)
            return res.status(401).json({ error: "unauthorized" });
        const { userId } = req.params;
        if (!userId || !mongoose_1.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "invalid user id" });
        }
        const { limit, skip } = parsePaging(req);
        const posts = await Post_1.Post.find({ author: new mongoose_1.Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("author", "username avatarUrl")
            .lean()
            .exec();
        const postIds = posts.map((post) => post._id);
        const liked = await Like_1.Like.find({
            userId: new mongoose_1.Types.ObjectId(viewerId),
            postId: { $in: postIds },
        })
            .select("postId")
            .lean();
        const likedSet = new Set(liked.map((item) => String(item.postId)));
        const items = posts.map((post) => toPostResponse(post, likedSet.has(String(post._id))));
        return res.json({
            items,
            nextSkip: skip + items.length,
            hasMore: items.length === limit,
        });
    },
    async getById(req, res) {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: "unauthorized" });
        const post = await Post_1.Post.findById(req.params.id).populate("author", "username avatarUrl").lean();
        if (!post)
            return res.status(404).json({ error: "Post not found" });
        const liked = await Like_1.Like.findOne({
            postId: post._id,
            userId: new mongoose_1.Types.ObjectId(userId),
        }).lean();
        return res.json(toPostResponse(post, Boolean(liked)));
    },
    async create(req, res) {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: "unauthorized" });
        const { text } = req.body;
        if (!text || !text.trim())
            return res.status(400).json({ error: "text is required" });
        const imageUrl = req.file
            ? (0, uploads_1.buildUploadUrl)(req, `/uploads/posts/${req.file.filename}`)
            : "";
        const embeddingFields = await buildEmbeddingFields(text.trim());
        const post = await Post_1.Post.create({
            author: new mongoose_1.Types.ObjectId(userId),
            text: text.trim(),
            imageUrl,
            ...embeddingFields,
        });
        const populated = await Post_1.Post.findById(post._id)
            .populate("author", "username avatarUrl")
            .lean();
        if (!populated)
            return res.status(500).json({ error: "Failed to create post" });
        return res.status(201).json(toPostResponse(populated, false));
    },
    async update(req, res) {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: "unauthorized" });
        const post = await Post_1.Post.findById(req.params.id);
        if (!post)
            return res.status(404).json({ error: "Post not found" });
        if (String(post.author) !== String(userId)) {
            return res.status(403).json({ error: "forbidden" });
        }
        const { text } = req.body;
        let textUpdated = false;
        if (typeof text === "string") {
            const trimmed = text.trim();
            if (!trimmed)
                return res.status(400).json({ error: "text is required" });
            post.text = trimmed;
            textUpdated = true;
        }
        if (req.file) {
            post.imageUrl = (0, uploads_1.buildUploadUrl)(req, `/uploads/posts/${req.file.filename}`);
        }
        if (textUpdated) {
            const embeddingFields = await buildEmbeddingFields(post.text);
            if (embeddingFields.embedding) {
                post.embedding = embeddingFields.embedding;
                post.embeddingModel = embeddingFields.embeddingModel || "";
                post.embeddingUpdatedAt = embeddingFields.embeddingUpdatedAt || new Date();
            }
        }
        await post.save();
        const populated = await Post_1.Post.findById(post._id)
            .populate("author", "username avatarUrl")
            .lean();
        if (!populated)
            return res.status(500).json({ error: "Failed to update post" });
        const liked = await Like_1.Like.findOne({
            postId: post._id,
            userId: new mongoose_1.Types.ObjectId(userId),
        }).lean();
        return res.json(toPostResponse(populated, Boolean(liked)));
    },
    async remove(req, res) {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: "unauthorized" });
        const post = await Post_1.Post.findById(req.params.id);
        if (!post)
            return res.status(404).json({ error: "Post not found" });
        if (String(post.author) !== String(userId)) {
            return res.status(403).json({ error: "forbidden" });
        }
        await Comment_1.Comment.deleteMany({ postId: post._id });
        await Like_1.Like.deleteMany({ postId: post._id });
        await post.deleteOne();
        return res.status(204).send();
    },
};
