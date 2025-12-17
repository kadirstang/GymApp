import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Create upload directories
const avatarUploadDir = path.join(__dirname, '../../uploads/avatars');
const gymLogoUploadDir = path.join(__dirname, '../../uploads/gym-logos');
const exerciseVideoUploadDir = path.join(__dirname, '../../uploads/exercise-videos');
const productImageUploadDir = path.join(__dirname, '../../uploads/product-images');

if (!fs.existsSync(avatarUploadDir)) {
  fs.mkdirSync(avatarUploadDir, { recursive: true });
}

if (!fs.existsSync(gymLogoUploadDir)) {
  fs.mkdirSync(gymLogoUploadDir, { recursive: true });
}

if (!fs.existsSync(exerciseVideoUploadDir)) {
  fs.mkdirSync(exerciseVideoUploadDir, { recursive: true });
}

if (!fs.existsSync(productImageUploadDir)) {
  fs.mkdirSync(productImageUploadDir, { recursive: true });
}

// Avatar storage configuration
const avatarStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: any) => {
    cb(null, avatarUploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  },
});

// Gym logo storage configuration
const gymLogoStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: any) => {
    cb(null, gymLogoUploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'gym-logo-' + uniqueSuffix + ext);
  },
});

// Exercise video storage configuration
const exerciseVideoStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: any) => {
    cb(null, exerciseVideoUploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'exercise-video-' + uniqueSuffix + ext);
  },
});

// Product image storage configuration
const productImageStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: any) => {
    cb(null, productImageUploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  },
});

// File filter - only images
const imageFileFilter = (_req: Request, file: Express.Multer.File, cb: any) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

// File filter - videos and images
const videoAndImageFileFilter = (_req: Request, file: Express.Multer.File, cb: any) => {
  const allowedMimes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/mpeg', 'video/webm', 'video/quicktime'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, MPEG, WebM, MOV) are allowed.'), false);
  }
};

// Multer instances
export const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

export const gymLogoUpload = multer({
  storage: gymLogoStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

export const exerciseVideoUpload = multer({
  storage: exerciseVideoStorage,
  fileFilter: videoAndImageFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max for videos
  },
});

export const productImageUpload = multer({
  storage: productImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// Helper function to delete old avatar
export const deleteAvatar = (avatarUrl: string): void => {
  try {
    const filename = path.basename(avatarUrl);
    const filePath = path.join(avatarUploadDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting avatar:', error);
  }
};

// Helper function to delete exercise video
export const deleteExerciseVideo = (videoUrl: string): void => {
  try {
    const filename = path.basename(videoUrl);
    const filePath = path.join(exerciseVideoUploadDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting exercise video:', error);
  }
};

// Helper function to delete product image
export const deleteProductImage = (imageUrl: string): void => {
  try {
    const filename = path.basename(imageUrl);
    const filePath = path.join(productImageUploadDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting product image:', error);
  }
};
