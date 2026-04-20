import type { Request, Response } from "express";
import { Types } from "mongoose";
import { Comment } from "../models/Comment";
import { Post } from "../models/Post";

type CommentAuthor = {
  _id: Types.ObjectId;
  username: string;
  avatarUrl?: string;
};

type CommentLean = {
  _id: Types.ObjectId;
  postId: Types.ObjectId;
  authorId: CommentAuthor;
  text: string;
  createdAt: Date;
};

function parsePaging(req: Request) {
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const skip = Math.max(Number(req.query.skip) || 0, 0);
  return { limit, skip };
}

function toCommentResponse(comment: CommentLean) {
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

export const commentsController = {
  async getForPost(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const postId = req.params.id;
    const { limit, skip } = parsePaging(req);

    const comments: CommentLean[] = await Comment.find({ postId: new Types.ObjectId(postId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("authorId", "username avatarUrl")
      .lean<CommentLean[]>()
      .exec();

    const items = comments.map(toCommentResponse);

    return res.json({
      items,
      nextSkip: skip + items.length,
      hasMore: items.length === limit,
    });
  },

  async create(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const { text } = req.body as { text?: string };
    if (!text || !text.trim()) return res.status(400).json({ error: "text is required" });

    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = await Comment.create({
      postId: new Types.ObjectId(postId),
      authorId: new Types.ObjectId(userId),
      text: text.trim(),
    });

    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

    const populated = await Comment.findById(comment._id)
      .populate("authorId", "username avatarUrl")
      .lean<CommentLean>();

    if (!populated) return res.status(500).json({ error: "Failed to create comment" });
    return res.status(201).json(toCommentResponse(populated));
  },
};
