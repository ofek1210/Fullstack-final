"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requests_controller_1 = require("../controllers/requests.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
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
router.get("/", requests_controller_1.requestsController.getAll);
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
router.get("/:id", requests_controller_1.requestsController.getById);
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
router.post("/", auth_middleware_1.authMiddleware, requests_controller_1.requestsController.create);
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
router.put("/:id", auth_middleware_1.authMiddleware, requests_controller_1.requestsController.update);
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
router.delete("/:id", auth_middleware_1.authMiddleware, requests_controller_1.requestsController.remove);
exports.default = router;
