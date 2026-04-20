"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "missing token" });
    }
    const token = header.split(" ")[1];
    const secret = process.env.JWT_SECRET;
    if (!secret)
        return res.status(500).json({ error: "server misconfigured" });
    try {
        const payload = jsonwebtoken_1.default.verify(token, secret);
        req.user = payload;
        return next();
    }
    catch {
        return res.status(401).json({ error: "invalid token" });
    }
}
