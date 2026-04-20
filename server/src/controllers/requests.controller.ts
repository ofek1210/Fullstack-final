import type { Request as ExRequest, Response } from "express";
import { Request as ReqModel } from "../models/Request";
import { Types } from "mongoose";

export const requestsController = {
  async create(req: ExRequest, res: Response) {
    const { title, description } = req.body as { title?: string; description?: string };

    if (!title) return res.status(400).json({ error: "title is required" });
    const userId = (req as any).user?.userId as string | undefined;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const doc = await ReqModel.create({
      title,
      description: description || "",
      createdBy: new Types.ObjectId(userId)
    } as any);

    return res.status(201).json(doc);
  },

  async getAll(_req: ExRequest, res: Response) {
    const items = await ReqModel.find().sort({ createdAt: -1 }).limit(100).lean();
    return res.json(items);
  },

  async getById(req: ExRequest, res: Response) {
    const { id } = req.params;
    const item = await ReqModel.findById(id).lean();
    if (!item) return res.status(404).json({ error: "not found" });
    return res.json(item);
  },

  async update(req: ExRequest, res: Response) {
    const { id } = req.params;
    const payload = req.body as Partial<{ title: string; description: string; status: string }>;

    const item = await ReqModel.findById(id);
    if (!item) return res.status(404).json({ error: "not found" });
    // Only creator may update (simple ownership check)
    const userId = (req as any).user?.userId as string | undefined;
    if (!userId || String((item as any).createdBy) !== String(userId)) {
      return res.status(403).json({ error: "forbidden" });
    }

    if (payload.title !== undefined) (item as any).title = payload.title as any;
    if (payload.description !== undefined) (item as any).description = payload.description as any;
    if (payload.status !== undefined) (item as any).status = payload.status as any;

    await item.save();
    return res.json(item);
  },

  async remove(req: ExRequest, res: Response) {
    const { id } = req.params;
    const item = await ReqModel.findById(id);
    if (!item) return res.status(404).json({ error: "not found" });
    const userId = (req as any).user?.userId as string | undefined;
    if (!userId || String((item as any).createdBy) !== String(userId)) {
      return res.status(403).json({ error: "forbidden" });
    }

    await item.deleteOne();
    return res.status(204).send();
  }
};
