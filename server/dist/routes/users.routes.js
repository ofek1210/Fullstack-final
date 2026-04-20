"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const users_controller_1 = require("../controllers/users.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const uploads_1 = require("../lib/uploads");
const router = (0, express_1.Router)();
const upload = (0, uploads_1.createAvatarUpload)();
function handleUploadError(err, res) {
    if (!err)
        return false;
    if (err instanceof multer_1.default.MulterError && err.code === "LIMIT_FILE_SIZE") {
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
router.get("/me", auth_middleware_1.authMiddleware, users_controller_1.usersController.getMe);
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
router.put("/me", auth_middleware_1.authMiddleware, users_controller_1.usersController.updateMe);
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
router.patch("/me", auth_middleware_1.authMiddleware, (req, res) => {
    upload.single("avatar")(req, res, (err) => {
        if (handleUploadError(err, res))
            return;
        void users_controller_1.usersController.updateMeWithAvatar(req, res);
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
router.get("/profile/:userId", auth_middleware_1.authMiddleware, users_controller_1.usersController.getPublicById);
exports.default = router;
