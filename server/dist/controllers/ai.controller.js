"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiController = void 0;
const ai_service_1 = require("../services/ai/ai.service");
const localEmbedding_provider_1 = require("../services/ai/localEmbedding.provider");
exports.aiController = {
    async search(req, res) {
        const { query, limit, includeAnswer } = req.body;
        if (!query || query.trim().length < 3) {
            return res.status(400).json({ error: "query must be at least 3 characters" });
        }
        try {
            const result = await (0, ai_service_1.searchPosts)(query.trim(), limit, Boolean(includeAnswer));
            return res.json(result);
        }
        catch (err) {
            return res.status(500).json({ error: "AI search failed" });
        }
    },
    health(_req, res) {
        return res.json({
            ok: true,
            provider: "local",
            model: (0, localEmbedding_provider_1.getEmbeddingModelName)(),
        });
    },
};
