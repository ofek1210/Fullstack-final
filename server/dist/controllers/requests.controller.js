"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestsController = void 0;
const Request_1 = require("../models/Request");
const mongoose_1 = require("mongoose");
exports.requestsController = {
    async create(req, res) {
        const { title, description } = req.body;
        if (!title)
            return res.status(400).json({ error: "title is required" });
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: "unauthorized" });
        const doc = await Request_1.Request.create({
            title,
            description: description || "",
            createdBy: new mongoose_1.Types.ObjectId(userId)
        });
        return res.status(201).json(doc);
    },
    async getAll(_req, res) {
        const items = await Request_1.Request.find().sort({ createdAt: -1 }).limit(100).lean();
        return res.json(items);
    },
    async getById(req, res) {
        const { id } = req.params;
        const item = await Request_1.Request.findById(id).lean();
        if (!item)
            return res.status(404).json({ error: "not found" });
        return res.json(item);
    },
    async update(req, res) {
        const { id } = req.params;
        const payload = req.body;
        const item = await Request_1.Request.findById(id);
        if (!item)
            return res.status(404).json({ error: "not found" });
        // Only creator may update (simple ownership check)
        const userId = req.user?.userId;
        if (!userId || String(item.createdBy) !== String(userId)) {
            return res.status(403).json({ error: "forbidden" });
        }
        if (payload.title !== undefined)
            item.title = payload.title;
        if (payload.description !== undefined)
            item.description = payload.description;
        if (payload.status !== undefined)
            item.status = payload.status;
        await item.save();
        return res.json(item);
    },
    async remove(req, res) {
        const { id } = req.params;
        const item = await Request_1.Request.findById(id);
        if (!item)
            return res.status(404).json({ error: "not found" });
        const userId = req.user?.userId;
        if (!userId || String(item.createdBy) !== String(userId)) {
            return res.status(403).json({ error: "forbidden" });
        }
        await item.deleteOne();
        return res.status(204).send();
    }
};
