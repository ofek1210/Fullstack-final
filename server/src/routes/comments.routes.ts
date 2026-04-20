import { Router } from "express";
import { commentsController } from "../controllers/comments.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * @openapi
 * /posts/{id}/comments:
 *   get:
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     summary: List comments for a post
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paged comments
 */
router.get("/:id/comments", authMiddleware, commentsController.getForPost);

/**
 * @openapi
 * /posts/{id}/comments:
 *   post:
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     summary: Add a comment to a post
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created comment
 */
router.post("/:id/comments", authMiddleware, commentsController.create);

export default router;
