import type { Request, Response } from "express";
import { searchPosts } from "../services/ai/ai.service";
import { getEmbeddingModelName } from "../services/ai/localEmbedding.provider";

export const aiController = {
  async search(req: Request, res: Response) {
    const { query, limit, includeAnswer } = req.body as {
      query?: string;
      limit?: number;
      includeAnswer?: boolean;
    };
    if (!query || query.trim().length < 3) {
      return res.status(400).json({ error: "query must be at least 3 characters" });
    }

    try {
      const result = await searchPosts(query.trim(), limit, Boolean(includeAnswer));
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: "AI search failed" });
    }
  },

  health(_req: Request, res: Response) {
    return res.json({
      ok: true,
      provider: "local",
      model: getEmbeddingModelName(),
    });
  },
};
