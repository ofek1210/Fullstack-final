"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const likes_controller_1 = require("../controllers/likes.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
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
router.post("/:id/like", auth_middleware_1.authMiddleware, likes_controller_1.likesController.like);
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
router.delete("/:id/like", auth_middleware_1.authMiddleware, likes_controller_1.likesController.unlike);
exports.default = router;
