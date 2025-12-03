import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '../utils/response.js';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Upload gym logo
 * POST /api/gyms/:id/logo
 */
export const uploadGymLogo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const file = req.file;

    if (!file) {
      return errorResponse(res, 'No file uploaded', 400);
    }

    // Verify access: SuperAdmin can update any gym, GymOwner can only update their own
    const where: any = {
      id,
      deletedAt: null
    };

    if (user.role !== 'SuperAdmin') {
      where.id = user.gymId;
    }

    const gym = await prisma.gym.findFirst({ where });

    if (!gym) {
      // Delete uploaded file if gym not found
      fs.unlinkSync(file.path);
      return errorResponse(res, 'Gym not found or unauthorized', 404);
    }

    // Delete old logo if exists
    if (gym.logoUrl) {
      const oldLogoPath = path.join(__dirname, '../..', gym.logoUrl);
      if (fs.existsSync(oldLogoPath)) {
        try {
          fs.unlinkSync(oldLogoPath);
        } catch (error) {
          console.error('Error deleting old logo:', error);
        }
      }
    }

    // Generate URL for the new logo
    const logoUrl = `/uploads/gym-logos/${file.filename}`;

    // Update gym with new logo URL
    const updatedGym = await prisma.gym.update({
      where: { id },
      data: { logoUrl }
    });

    return successResponse(res, updatedGym, 'Logo uploaded successfully');
  } catch (error) {
    console.error('Error uploading logo:', error);
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return errorResponse(res, 'Failed to upload logo', 500);
  }
};

/**
 * Delete gym logo
 * DELETE /api/gyms/:id/logo
 */
export const deleteGymLogo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Verify access
    const where: any = {
      id,
      deletedAt: null
    };

    if (user.role !== 'SuperAdmin') {
      where.id = user.gymId;
    }

    const gym = await prisma.gym.findFirst({ where });

    if (!gym) {
      return errorResponse(res, 'Gym not found or unauthorized', 404);
    }

    if (!gym.logoUrl) {
      return errorResponse(res, 'No logo to delete', 400);
    }

    // Delete logo file
    const logoPath = path.join(__dirname, '../..', gym.logoUrl);
    if (fs.existsSync(logoPath)) {
      try {
        fs.unlinkSync(logoPath);
      } catch (error) {
        console.error('Error deleting logo file:', error);
      }
    }

    // Update gym to remove logo URL
    const updatedGym = await prisma.gym.update({
      where: { id },
      data: { logoUrl: null }
    });

    return successResponse(res, updatedGym, 'Logo deleted successfully');
  } catch (error) {
    console.error('Error deleting logo:', error);
    return errorResponse(res, 'Failed to delete logo', 500);
  }
};
