import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import type { Request } from "express";

const uploadsRoot = path.resolve(process.cwd(), "uploads");
const avatarUploadDir = path.join(uploadsRoot, "avatars");
const postUploadDir = path.join(uploadsRoot, "posts");

fs.mkdirSync(avatarUploadDir, { recursive: true });
fs.mkdirSync(postUploadDir, { recursive: true });

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const imageExtensionMap: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function imageFileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (!allowedImageTypes.has(file.mimetype)) {
    cb(new Error("Only JPG, PNG, or WEBP files are allowed"));
    return;
  }
  cb(null, true);
}

export function getUploadsRoot() {
  return uploadsRoot;
}

export function buildUploadUrl(req: Request, relativePath: string) {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}${relativePath}`;
}

export function createAvatarUpload() {
  return multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, avatarUploadDir),
      filename: (req, file, cb) => {
        const extension = imageExtensionMap[file.mimetype] || path.extname(file.originalname) || ".jpg";
        const safeUserId = req.user?.userId ?? "user";
        cb(null, `${safeUserId}${extension}`);
      },
    }),
    limits: { fileSize: 3 * 1024 * 1024 },
    fileFilter: imageFileFilter,
  });
}

export function createPostImageUpload() {
  return multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, postUploadDir),
      filename: (req, file, cb) => {
        const extension = imageExtensionMap[file.mimetype] || path.extname(file.originalname) || ".jpg";
        const safeUserId = req.user?.userId ?? "user";
        cb(null, `${safeUserId}-${Date.now()}${extension}`);
      },
    }),
    limits: { fileSize: 3 * 1024 * 1024 },
    fileFilter: imageFileFilter,
  });
}
