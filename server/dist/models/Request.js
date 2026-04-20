"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Request = void 0;
const mongoose_1 = require("mongoose");
const requestSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["open", "in_progress", "closed"], default: "open" },
    createdBy: { type: mongoose_1.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
exports.Request = (0, mongoose_1.model)("Request", requestSchema);
