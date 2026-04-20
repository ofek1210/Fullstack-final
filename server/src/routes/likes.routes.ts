import { Router } from "express";
import { likesController } from "../controllers/likes.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * @openapi
 * /posts/{id}/like:
 *   post:
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     summary: Like a post
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Like status
 */
router.post("/:id/like", authMiddleware, likesController.like);

/**
 * @openapi
 * /posts/{id}/like:
 *   delete:
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     summary: Unlike a post
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Like status
 */
router.delete("/:id/like", authMiddleware, likesController.unlike);

export default router;
