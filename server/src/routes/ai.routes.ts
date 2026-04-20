import { Router } from "express";
import { aiController } from "../controllers/ai.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { createRateLimiter } from "../middleware/rateLimit";

const router = Router();

const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
});

/**
 * @openapi
 * /ai/health:
 *   get:
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     summary: AI health check
 *     responses:
 *       200:
 *         description: AI health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 provider:
 *                   type: string
 *                 model:
 *                   type: string
 */
router.get("/health", authMiddleware, aiController.health);

/**
 * @openapi
 * /ai/search:
 *   post:
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     summary: Semantic search across local posts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query:
 *                 type: string
 *               limit:
 *                 type: integer
 *               includeAnswer:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Search response
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/AiSearchLocalResponse'
 *                 - $ref: '#/components/schemas/AiSearchFallbackResponse'
 */
router.post("/search", authMiddleware, aiRateLimiter, aiController.search);

/**
 * @openapi
 * /ai/query:
 *   post:
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     summary: Legacy AI search endpoint (alias of /ai/search)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query:
 *                 type: string
 *               limit:
 *                 type: integer
 *               includeAnswer:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Search response
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/AiSearchLocalResponse'
 *                 - $ref: '#/components/schemas/AiSearchFallbackResponse'
 */
router.post("/query", authMiddleware, aiRateLimiter, aiController.search);

export default router;
