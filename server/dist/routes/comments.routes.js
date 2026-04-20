"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const comments_controller_1 = require("../controllers/comments.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
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
router.get("/:id/comments", auth_middleware_1.authMiddleware, comments_controller_1.commentsController.getForPost);
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
router.post("/:id/comments", auth_middleware_1.authMiddleware, comments_controller_1.commentsController.create);
exports.default = router;
