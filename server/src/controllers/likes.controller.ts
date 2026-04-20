import type { Request, Response } from "express";
import { MongoServerError } from "mongodb";
import { Types } from "mongoose";
import { Like } from "../models/Like";
import { Post } from "../models/Post";

export const likesController = {
  async like(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    try {
      await Like.create({
        postId: new Types.ObjectId(postId),
        userId: new Types.ObjectId(userId),
      });
      await Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });
    } catch (err: unknown) {
      if (!(err instanceof MongoServerError && err.code === 11000)) {
        return res.status(500).json({ error: "Failed to like post" });
      }
    }

    const updated = await Post.findById(postId).lean();
    return res.json({
      likesCount: updated?.likesCount ?? post.likesCount,
      likedByMe: true,
    });
  },

  async unlike(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const removed = await Like.findOneAndDelete({
      postId: new Types.ObjectId(postId),
      userId: new Types.ObjectId(userId),
    });

    if (removed) {
      await Post.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } });
    }

    const updated = await Post.findById(postId).lean();
    return res.json({
      likesCount: Math.max(updated?.likesCount ?? post.likesCount, 0),
      likedByMe: false,
    });
  },
};
