"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_controller_1 = require("../controllers/ai.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimit_1 = require("../middleware/rateLimit");
const router = (0, express_1.Router)();
const aiRateLimiter = (0, rateLimit_1.createRateLimiter)({
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
router.get("/health", auth_middleware_1.authMiddleware, ai_controller_1.aiController.health);
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
router.post("/search", auth_middleware_1.authMiddleware, aiRateLimiter, ai_controller_1.aiController.search);
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
router.post("/query", auth_middleware_1.authMiddleware, aiRateLimiter, ai_controller_1.aiController.search);
exports.default = router;
