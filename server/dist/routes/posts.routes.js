"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const posts_controller_1 = require("../controllers/posts.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const uploads_1 = require("../lib/uploads");
const router = (0, express_1.Router)();
const upload = (0, uploads_1.createPostImageUpload)();
function handleUploadError(err, res) {
    if (!err)
        return false;
    if (err instanceof multer_1.default.MulterError && err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "Image must be 3MB or smaller" });
        return true;
    }
    res.status(400).json({ error: err instanceof Error ? err.message : "Invalid upload" });
    return true;
}
/**
 * @openapi
 * /posts:
 *   get:
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     summary: List posts (paged)
 *     parameters:
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
 *         description: Paged posts
 */
router.get("/", auth_middleware_1.authMiddleware, posts_controller_1.postsController.getAll);
/**
 * @openapi
 * /posts/mine:
 *   get:
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     summary: List current user's posts
 *     parameters:
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
 *         description: Paged posts
 */
router.get("/mine", auth_middleware_1.authMiddleware, posts_controller_1.postsController.getMine);
/**
 * @openapi
 * /posts/by-user/{userId}:
 *   get:
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     summary: List posts by user id (paged)
 *     parameters:
 *       - in: path
 *         name: userId
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
 *         description: Paged posts
 */
router.get("/by-user/:userId", auth_middleware_1.authMiddleware, posts_controller_1.postsController.getByAuthor);
/**
 * @openapi
 * /posts/{id}:
 *   get:
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     summary: Get post by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post
 */
router.get("/:id", auth_middleware_1.authMiddleware, posts_controller_1.postsController.getById);
/**
 * @openapi
 * /posts:
 *   post:
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     summary: Create post with optional image
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Created post
 */
router.post("/", auth_middleware_1.authMiddleware, (req, res) => {
    upload.single("image")(req, res, (err) => {
        if (handleUploadError(err, res))
            return;
        void posts_controller_1.postsController.create(req, res);
    });
});
/**
 * @openapi
 * /posts/{id}:
 *   put:
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     summary: Update post text and image
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Updated post
 */
router.put("/:id", auth_middleware_1.authMiddleware, (req, res) => {
    upload.single("image")(req, res, (err) => {
        if (handleUploadError(err, res))
            return;
        void posts_controller_1.postsController.update(req, res);
    });
});
/**
 * @openapi
 * /posts/{id}:
 *   delete:
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     summary: Delete post
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Deleted
 */
router.delete("/:id", auth_middleware_1.authMiddleware, posts_controller_1.postsController.remove);
exports.default = router;
