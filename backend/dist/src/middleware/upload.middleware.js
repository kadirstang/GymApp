"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAvatar = exports.gymLogoUpload = exports.avatarUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const avatarUploadDir = path_1.default.join(__dirname, '../../uploads/avatars');
const gymLogoUploadDir = path_1.default.join(__dirname, '../../uploads/gym-logos');
if (!fs_1.default.existsSync(avatarUploadDir)) {
    fs_1.default.mkdirSync(avatarUploadDir, { recursive: true });
}
if (!fs_1.default.existsSync(gymLogoUploadDir)) {
    fs_1.default.mkdirSync(gymLogoUploadDir, { recursive: true });
}
const avatarStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, avatarUploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, 'avatar-' + uniqueSuffix + ext);
    },
});
const gymLogoStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, gymLogoUploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, 'gym-logo-' + uniqueSuffix + ext);
    },
});
const imageFileFilter = (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
};
exports.avatarUpload = (0, multer_1.default)({
    storage: avatarStorage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});
exports.gymLogoUpload = (0, multer_1.default)({
    storage: gymLogoStorage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});
const deleteAvatar = (avatarUrl) => {
    try {
        const filename = path_1.default.basename(avatarUrl);
        const filePath = path_1.default.join(avatarUploadDir, filename);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
    }
    catch (error) {
        console.error('Error deleting avatar:', error);
    }
};
exports.deleteAvatar = deleteAvatar;
//# sourceMappingURL=upload.middleware.js.map