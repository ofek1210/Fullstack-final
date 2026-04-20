import type { Request, Response } from "express";
import { Types } from "mongoose";
import { Post } from "../models/Post";
import { Like } from "../models/Like";
import { Comment } from "../models/Comment";
import { buildUploadUrl } from "../lib/uploads";
import { generateEmbedding, getEmbeddingModelName } from "../services/ai/localEmbedding.provider";

type PostAuthor = {
  _id: Types.ObjectId;
  username: string;
  avatarUrl?: string;
};

type PostLean = {
  _id: Types.ObjectId;
  author: PostAuthor;
  text: string;
  imageUrl: string;
  commentsCount: number;
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
};

type EmbeddingFields = {
  embedding?: number[];
  embeddingModel?: string;
  embeddingUpdatedAt?: Date;
};

async function buildEmbeddingFields(text: string): Promise<EmbeddingFields> {
  try {
    const embedding = await generateEmbedding(text);
    return {
      embedding,
      embeddingModel: getEmbeddingModelName(),
      embeddingUpdatedAt: new Date(),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate embedding";
    console.error("Embedding generation failed", { message });
    return {};
  }
}

function parsePaging(req: Request) {
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const skip = Math.max(Number(req.query.skip) || 0, 0);
  return { limit, skip };
}

function toPostResponse(post: PostLean, likedByMe: boolean) {
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

export const postsController = {
  async getAll(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const { limit, skip } = parsePaging(req);
    const posts: PostLean[] = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "username avatarUrl")
      .lean<PostLean[]>()
      .exec();

    const postIds = posts.map((post) => post._id);
    const liked = await Like.find({
      userId: new Types.ObjectId(userId),
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

  async getMine(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const { limit, skip } = parsePaging(req);
    const posts: PostLean[] = await Post.find({ author: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "username avatarUrl")
      .lean<PostLean[]>()
      .exec();

    const postIds = posts.map((post) => post._id);
    const liked = await Like.find({
      userId: new Types.ObjectId(userId),
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

  async getByAuthor(req: Request, res: Response) {
    const viewerId = req.user?.userId;
    if (!viewerId) return res.status(401).json({ error: "unauthorized" });

    const { userId } = req.params;
    if (!userId || !Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "invalid user id" });
    }

    const { limit, skip } = parsePaging(req);
    const posts: PostLean[] = await Post.find({ author: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "username avatarUrl")
      .lean<PostLean[]>()
      .exec();

    const postIds = posts.map((post) => post._id);
    const liked = await Like.find({
      userId: new Types.ObjectId(viewerId),
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

  async getById(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const post = await Post.findById(req.params.id).populate("author", "username avatarUrl").lean<PostLean>();
    if (!post) return res.status(404).json({ error: "Post not found" });

    const liked = await Like.findOne({
      postId: post._id,
      userId: new Types.ObjectId(userId),
    }).lean();

    return res.json(toPostResponse(post, Boolean(liked)));
  },

  async create(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const { text } = req.body as { text?: string };
    if (!text || !text.trim()) return res.status(400).json({ error: "text is required" });

    const imageUrl = req.file
      ? buildUploadUrl(req, `/uploads/posts/${req.file.filename}`)
      : "";

    const embeddingFields = await buildEmbeddingFields(text.trim());
    const post = await Post.create({
      author: new Types.ObjectId(userId),
      text: text.trim(),
      imageUrl,
      ...embeddingFields,
    });

    const populated = await Post.findById(post._id)
      .populate("author", "username avatarUrl")
      .lean<PostLean>();

    if (!populated) return res.status(500).json({ error: "Failed to create post" });
    return res.status(201).json(toPostResponse(populated, false));
  },

  async update(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (String(post.author) !== String(userId)) {
      return res.status(403).json({ error: "forbidden" });
    }

    const { text } = req.body as { text?: string };
    let textUpdated = false;
    if (typeof text === "string") {
      const trimmed = text.trim();
      if (!trimmed) return res.status(400).json({ error: "text is required" });
      post.text = trimmed;
      textUpdated = true;
    }

    if (req.file) {
      post.imageUrl = buildUploadUrl(req, `/uploads/posts/${req.file.filename}`);
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

    const populated = await Post.findById(post._id)
      .populate("author", "username avatarUrl")
      .lean<PostLean>();

    if (!populated) return res.status(500).json({ error: "Failed to update post" });

    const liked = await Like.findOne({
      postId: post._id,
      userId: new Types.ObjectId(userId),
    }).lean();

    return res.json(toPostResponse(populated, Boolean(liked)));
  },

  async remove(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (String(post.author) !== String(userId)) {
      return res.status(403).json({ error: "forbidden" });
    }

    await Comment.deleteMany({ postId: post._id });
    await Like.deleteMany({ postId: post._id });
    await post.deleteOne();

    return res.status(204).send();
  },
};
