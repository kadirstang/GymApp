import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Create upload directories
const avatarUploadDir = path.join(__dirname, '../../uploads/avatars');
const gymLogoUploadDir = path.join(__dirname, '../../uploads/gym-logos');

if (!fs.existsSync(avatarUploadDir)) {
  fs.mkdirSync(avatarUploadDir, { recursive: true });
}

if (!fs.existsSync(gymLogoUploadDir)) {
  fs.mkdirSync(gymLogoUploadDir, { recursive: true });
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

// File filter - only images
const imageFileFilter = (_req: Request, file: Express.Multer.File, cb: any) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
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
