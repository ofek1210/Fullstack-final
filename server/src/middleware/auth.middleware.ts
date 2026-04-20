import type { Request, Response, NextFunction } from "express";
import jwt, { type Secret } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; username: string };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "missing token" });
  }

  const token = header.split(" ")[1];
  const secret = process.env.JWT_SECRET as Secret;
  if (!secret) return res.status(500).json({ error: "server misconfigured" });

  try {
    const payload = jwt.verify(token, secret) as { userId: string; username: string };
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "invalid token" });
  }
}
