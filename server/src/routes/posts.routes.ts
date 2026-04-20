import { Router, type Response } from "express";
import multer from "multer";
import { postsController } from "../controllers/posts.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { createPostImageUpload } from "../lib/uploads";

const router = Router();
const upload = createPostImageUpload();

function handleUploadError(err: unknown, res: Response) {
  if (!err) return false;
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
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
router.get("/", authMiddleware, postsController.getAll);
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
router.get("/mine", authMiddleware, postsController.getMine);
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
router.get("/by-user/:userId", authMiddleware, postsController.getByAuthor);
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
router.get("/:id", authMiddleware, postsController.getById);

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
router.post("/", authMiddleware, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (handleUploadError(err, res)) return;
    void postsController.create(req, res);
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
router.put("/:id", authMiddleware, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (handleUploadError(err, res)) return;
    void postsController.update(req, res);
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
router.delete("/:id", authMiddleware, postsController.remove);

export default router;
