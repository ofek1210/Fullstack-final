"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRateLimiter = createRateLimiter;
function createRateLimiter(options) {
    const buckets = new Map();
    return function rateLimiter(req, res, next) {
        const key = options.keyGenerator?.(req) ?? req.user?.userId ?? req.ip ?? "anonymous";
        const now = Date.now();
        const bucket = buckets.get(key);
        if (!bucket || now > bucket.resetAt) {
            buckets.set(key, { count: 1, resetAt: now + options.windowMs });
            return next();
        }
        if (bucket.count >= options.max) {
            return res.status(429).json({ error: "Too many requests, please try again later." });
        }
        bucket.count += 1;
        return next();
    };
}
