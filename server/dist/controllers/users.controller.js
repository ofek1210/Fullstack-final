"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersController = void 0;
const mongoose_1 = require("mongoose");
const User_1 = require("../models/User");
const uploads_1 = require("../lib/uploads");
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const GENDER_VALUES = new Set(["male", "female", "other", "prefer_not_to_say"]);
function toUserResponse(user) {
    return {
        userId: String(user._id),
        username: user.username,
        fullName: user.fullName || "",
        email: user.email || "",
        avatarUrl: user.avatarUrl || "",
        birthDate: user.birthDate ? user.birthDate.toISOString().split("T")[0] : "",
        gender: user.gender || "",
        phone: user.phone || "",
        city: user.city || "",
        bio: user.bio || "",
        oauthProvider: user.oauthProvider || "local",
    };
}
async function ensureUniqueUsername(username, userId) {
    const existing = await User_1.User.findOne({ username, _id: { $ne: userId } });
    return !existing;
}
async function ensureUniqueEmail(email, userId) {
    const existing = await User_1.User.findOne({ email, _id: { $ne: userId } });
    return !existing;
}
function normalizeEmail(email) {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed)
        return null;
    if (!EMAIL_REGEX.test(trimmed))
        return null;
    return trimmed;
}
function normalizeGender(gender) {
    const trimmed = gender.trim().toLowerCase();
    if (!trimmed)
        return null;
    return GENDER_VALUES.has(trimmed) ? trimmed : null;
}
function parseBirthDate(value) {
    const trimmed = value.trim();
    if (!trimmed)
        return null;
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime()))
        return null;
    const now = new Date();
    if (parsed > now)
        return null;
    return parsed;
}
function toPublicUserResponse(user) {
    return {
        userId: String(user._id),
        username: user.username,
        fullName: user.fullName || "",
        avatarUrl: user.avatarUrl || "",
        bio: user.bio || "",
        oauthProvider: user.oauthProvider || "local",
    };
}
exports.usersController = {
    async getPublicById(req, res) {
        const { userId } = req.params;
        if (!userId || !mongoose_1.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "invalid user id" });
        }
        const user = await User_1.User.findById(userId);
        if (!user)
            return res.status(404).json({ error: "User not found" });
        return res.json({ user: toPublicUserResponse(user) });
    },
    async getMe(req, res) {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: "unauthorized" });
        const user = await User_1.User.findById(userId);
        if (!user)
            return res.status(404).json({ error: "User not found" });
        return res.json({ user: toUserResponse(user) });
    },
    async updateMe(req, res) {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: "unauthorized" });
        const user = await User_1.User.findById(userId);
        if (!user)
            return res.status(404).json({ error: "User not found" });
        const { username, avatarUrl, email, birthDate, gender } = req.body;
        const update = {};
        if (typeof username === "string") {
            const trimmed = username.trim();
            if (!trimmed)
                return res.status(400).json({ error: "invalid username" });
            const ok = await ensureUniqueUsername(trimmed, userId);
            if (!ok)
                return res.status(409).json({ error: "username already exists" });
            update.username = trimmed;
        }
        if (typeof avatarUrl === "string") {
            update.avatarUrl = avatarUrl.trim();
        }
        if (typeof email === "string") {
            const normalized = normalizeEmail(email);
            if (!normalized)
                return res.status(400).json({ error: "invalid email" });
            const isOauth = Boolean(user.oauthProvider && user.oauthProvider !== "local");
            const hasEmail = Boolean(user.email && user.email.trim());
            if (isOauth && hasEmail && normalized !== user.email) {
                return res.status(403).json({ error: "email cannot be changed for OAuth users" });
            }
            if (normalized !== user.email) {
                const ok = await ensureUniqueEmail(normalized, userId);
                if (!ok)
                    return res.status(409).json({ error: "email already exists" });
                update.email = normalized;
            }
        }
        if (typeof birthDate === "string") {
            const parsed = parseBirthDate(birthDate);
            if (!parsed)
                return res.status(400).json({ error: "invalid birthDate" });
            update.birthDate = parsed;
        }
        if (typeof gender === "string") {
            const normalized = normalizeGender(gender);
            if (!normalized)
                return res.status(400).json({ error: "invalid gender" });
            update.gender = normalized;
        }
        const updated = await User_1.User.findByIdAndUpdate(userId, update, { new: true });
        if (!updated)
            return res.status(404).json({ error: "User not found" });
        return res.json({ user: toUserResponse(updated) });
    },
    async updateMeWithAvatar(req, res) {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ error: "unauthorized" });
        const user = await User_1.User.findById(userId);
        if (!user)
            return res.status(404).json({ error: "User not found" });
        const { username, email, birthDate, gender } = req.body;
        const update = {};
        if (typeof username === "string") {
            const trimmed = username.trim();
            if (!trimmed)
                return res.status(400).json({ error: "invalid username" });
            const ok = await ensureUniqueUsername(trimmed, userId);
            if (!ok)
                return res.status(409).json({ error: "username already exists" });
            update.username = trimmed;
        }
        if (req.file) {
            update.avatarUrl = (0, uploads_1.buildUploadUrl)(req, `/uploads/avatars/${req.file.filename}`);
        }
        if (typeof email === "string") {
            const normalized = normalizeEmail(email);
            if (!normalized)
                return res.status(400).json({ error: "invalid email" });
            const isOauth = Boolean(user.oauthProvider && user.oauthProvider !== "local");
            const hasEmail = Boolean(user.email && user.email.trim());
            if (isOauth && hasEmail && normalized !== user.email) {
                return res.status(403).json({ error: "email cannot be changed for OAuth users" });
            }
            if (normalized !== user.email) {
                const ok = await ensureUniqueEmail(normalized, userId);
                if (!ok)
                    return res.status(409).json({ error: "email already exists" });
                update.email = normalized;
            }
        }
        if (typeof birthDate === "string") {
            const parsed = parseBirthDate(birthDate);
            if (!parsed)
                return res.status(400).json({ error: "invalid birthDate" });
            update.birthDate = parsed;
        }
        if (typeof gender === "string") {
            const normalized = normalizeGender(gender);
            if (!normalized)
                return res.status(400).json({ error: "invalid gender" });
            update.gender = normalized;
        }
        const updated = await User_1.User.findByIdAndUpdate(userId, update, { new: true });
        if (!updated)
            return res.status(404).json({ error: "User not found" });
        return res.json({ user: toUserResponse(updated) });
    },
};
