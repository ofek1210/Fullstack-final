import type { Request, Response, NextFunction } from "express";

type RateLimitOptions = {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
};

type RateBucket = {
  count: number;
  resetAt: number;
};

export function createRateLimiter(options: RateLimitOptions) {
  const buckets = new Map<string, RateBucket>();

  return function rateLimiter(req: Request, res: Response, next: NextFunction) {
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
