import { Router, type Response } from "express";
import multer from "multer";
import { usersController } from "../controllers/users.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { createAvatarUpload } from "../lib/uploads";

const router = Router();
const upload = createAvatarUpload();

function handleUploadError(err: unknown, res: Response) {
  if (!err) return false;
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({ error: "Avatar must be 3MB or smaller" });
    return true;
  }
  res.status(400).json({ error: err instanceof Error ? err.message : "Invalid upload" });
  return true;
}

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     summary: Get current user profile
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 */
router.get("/me", authMiddleware, usersController.getMe);

/**
 * @openapi
 * /users/me:
 *   put:
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     summary: Update username or avatar URL
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *               email:
 *                 type: string
 *               birthDate:
 *                 type: string
 *               gender:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated user
 */
router.put("/me", authMiddleware, usersController.updateMe);

/**
 * @openapi
 * /users/me:
 *   patch:
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     summary: Update username and/or avatar image
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *               email:
 *                 type: string
 *               birthDate:
 *                 type: string
 *               gender:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated user
 */
router.patch("/me", authMiddleware, (req, res) => {
  upload.single("avatar")(req, res, (err) => {
    if (handleUploadError(err, res)) return;
    void usersController.updateMeWithAvatar(req, res);
  });
});

/**
 * @openapi
 * /users/profile/{userId}:
 *   get:
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     summary: Get another user's public profile
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Public profile
 *       404:
 *         description: Not found
 */
router.get("/profile/:userId", authMiddleware, usersController.getPublicById);

export default router;
