"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUploadsRoot = getUploadsRoot;
exports.buildUploadUrl = buildUploadUrl;
exports.createAvatarUpload = createAvatarUpload;
exports.createPostImageUpload = createPostImageUpload;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const multer_1 = __importDefault(require("multer"));
const uploadsRoot = node_path_1.default.resolve(process.cwd(), "uploads");
const avatarUploadDir = node_path_1.default.join(uploadsRoot, "avatars");
const postUploadDir = node_path_1.default.join(uploadsRoot, "posts");
node_fs_1.default.mkdirSync(avatarUploadDir, { recursive: true });
node_fs_1.default.mkdirSync(postUploadDir, { recursive: true });
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const imageExtensionMap = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
};
function imageFileFilter(_req, file, cb) {
    if (!allowedImageTypes.has(file.mimetype)) {
        cb(new Error("Only JPG, PNG, or WEBP files are allowed"));
        return;
    }
    cb(null, true);
}
function getUploadsRoot() {
    return uploadsRoot;
}
function buildUploadUrl(req, relativePath) {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return `${baseUrl}${relativePath}`;
}
function createAvatarUpload() {
    return (0, multer_1.default)({
        storage: multer_1.default.diskStorage({
            destination: (_req, _file, cb) => cb(null, avatarUploadDir),
            filename: (req, file, cb) => {
                const extension = imageExtensionMap[file.mimetype] || node_path_1.default.extname(file.originalname) || ".jpg";
                const safeUserId = req.user?.userId ?? "user";
                cb(null, `${safeUserId}${extension}`);
            },
        }),
        limits: { fileSize: 3 * 1024 * 1024 },
        fileFilter: imageFileFilter,
    });
}
function createPostImageUpload() {
    return (0, multer_1.default)({
        storage: multer_1.default.diskStorage({
            destination: (_req, _file, cb) => cb(null, postUploadDir),
            filename: (req, file, cb) => {
                const extension = imageExtensionMap[file.mimetype] || node_path_1.default.extname(file.originalname) || ".jpg";
                const safeUserId = req.user?.userId ?? "user";
                cb(null, `${safeUserId}-${Date.now()}${extension}`);
            },
        }),
        limits: { fileSize: 3 * 1024 * 1024 },
        fileFilter: imageFileFilter,
    });
}
