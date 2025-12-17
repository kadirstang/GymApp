"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProductImage = exports.deleteExerciseVideo = exports.deleteAvatar = exports.productImageUpload = exports.exerciseVideoUpload = exports.gymLogoUpload = exports.avatarUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const avatarUploadDir = path_1.default.join(__dirname, '../../uploads/avatars');
const gymLogoUploadDir = path_1.default.join(__dirname, '../../uploads/gym-logos');
const exerciseVideoUploadDir = path_1.default.join(__dirname, '../../uploads/exercise-videos');
const productImageUploadDir = path_1.default.join(__dirname, '../../uploads/product-images');
if (!fs_1.default.existsSync(avatarUploadDir)) {
    fs_1.default.mkdirSync(avatarUploadDir, { recursive: true });
}
if (!fs_1.default.existsSync(gymLogoUploadDir)) {
    fs_1.default.mkdirSync(gymLogoUploadDir, { recursive: true });
}
if (!fs_1.default.existsSync(exerciseVideoUploadDir)) {
    fs_1.default.mkdirSync(exerciseVideoUploadDir, { recursive: true });
}
if (!fs_1.default.existsSync(productImageUploadDir)) {
    fs_1.default.mkdirSync(productImageUploadDir, { recursive: true });
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
const exerciseVideoStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, exerciseVideoUploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, 'exercise-video-' + uniqueSuffix + ext);
    },
});
const productImageStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, productImageUploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, 'product-' + uniqueSuffix + ext);
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
const videoAndImageFileFilter = (_req, file, cb) => {
    const allowedMimes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/mpeg', 'video/webm', 'video/quicktime'
    ];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, MPEG, WebM, MOV) are allowed.'), false);
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
exports.exerciseVideoUpload = (0, multer_1.default)({
    storage: exerciseVideoStorage,
    fileFilter: videoAndImageFileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024,
    },
});
exports.productImageUpload = (0, multer_1.default)({
    storage: productImageStorage,
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
const deleteExerciseVideo = (videoUrl) => {
    try {
        const filename = path_1.default.basename(videoUrl);
        const filePath = path_1.default.join(exerciseVideoUploadDir, filename);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
    }
    catch (error) {
        console.error('Error deleting exercise video:', error);
    }
};
exports.deleteExerciseVideo = deleteExerciseVideo;
const deleteProductImage = (imageUrl) => {
    try {
        const filename = path_1.default.basename(imageUrl);
        const filePath = path_1.default.join(productImageUploadDir, filename);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
    }
    catch (error) {
        console.error('Error deleting product image:', error);
    }
};
exports.deleteProductImage = deleteProductImage;
//# sourceMappingURL=upload.middleware.js.map