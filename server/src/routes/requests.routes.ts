import { Router } from "express";
import { requestsController } from "../controllers/requests.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Public
/**
 * @openapi
 * /requests:
 *   get:
 *     tags: [Requests]
 *     summary: List requests
 *     responses:
 *       200:
 *         description: List of requests
 */
router.get("/", requestsController.getAll);
/**
 * @openapi
 * /requests/{id}:
 *   get:
 *     tags: [Requests]
 *     summary: Get request by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request found
 */
router.get("/:id", requestsController.getById);

// Protected
/**
 * @openapi
 * /requests:
 *   post:
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     summary: Create request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 */
router.post("/", authMiddleware, requestsController.create);
/**
 * @openapi
 * /requests/{id}:
 *   put:
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     summary: Update request
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated
 */
router.put("/:id", authMiddleware, requestsController.update);
/**
 * @openapi
 * /requests/{id}:
 *   delete:
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     summary: Delete request
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
router.delete("/:id", authMiddleware, requestsController.remove);

export default router;
