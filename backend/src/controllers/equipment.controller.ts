import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '../utils/response';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

/**
 * Get all equipment for a gym with filtering and pagination
 */
export const getEquipment = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const search = req.query.search as string;
    const status = req.query.status as string;

    // Build where clause
    const where: any = {
      gymId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && ['active', 'maintenance', 'broken'].includes(status)) {
      where.status = status;
    }

    const [equipment, total] = await Promise.all([
      prisma.equipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          qrCodeUuid: true,
          videoUrl: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              exercises: true,
            },
          },
        },
      }),
      prisma.equipment.count({ where }),
    ]);

    return successResponse(res, {
      items: equipment,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get equipment error:', error);
    return errorResponse(res, 'Failed to retrieve equipment', 500);
  }
};

/**
 * Get single equipment by ID
 */
export const getEquipmentById = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { id } = req.params;

    const equipment = await prisma.equipment.findFirst({
      where: {
        id,
        gymId,
        deletedAt: null,
      },
      include: {
        exercises: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            targetMuscleGroup: true,
          },
        },
      },
    });

    if (!equipment) {
      return errorResponse(res, 'Equipment not found', 404);
    }

    return successResponse(res, equipment);
  } catch (error: any) {
    console.error('Get equipment by ID error:', error);
    return errorResponse(res, 'Failed to retrieve equipment', 500);
  }
};

/**
 * Create new equipment
 */
export const createEquipment = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { name, description, videoUrl, status } = req.body;

    // Check for duplicate name in the same gym
    const existing = await prisma.equipment.findFirst({
      where: {
        name,
        gymId,
        deletedAt: null,
      },
    });

    if (existing) {
      return errorResponse(res, 'Equipment with this name already exists', 409);
    }

    const equipment = await prisma.equipment.create({
      data: {
        gymId,
        name,
        description: description || null,
        videoUrl: videoUrl || null,
        status: status || 'active',
      },
      select: {
        id: true,
        name: true,
        description: true,
        qrCodeUuid: true,
        videoUrl: true,
        status: true,
        createdAt: true,
      },
    });

    return successResponse(res, equipment, 'Equipment created successfully', 201);
  } catch (error: any) {
    console.error('Create equipment error:', error);
    return errorResponse(res, 'Failed to create equipment', 500);
  }
};

/**
 * Update equipment
 */
export const updateEquipment = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { id } = req.params;
    const { name, description, videoUrl, status } = req.body;

    // Verify equipment exists
    const existing = await prisma.equipment.findFirst({
      where: {
        id,
        gymId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return errorResponse(res, 'Equipment not found', 404);
    }

    // Check for duplicate name if name is being changed
    if (name && name !== existing.name) {
      const duplicate = await prisma.equipment.findFirst({
        where: {
          name,
          gymId,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (duplicate) {
        return errorResponse(res, 'Equipment with this name already exists', 409);
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
    if (status !== undefined) updateData.status = status;

    const equipment = await prisma.equipment.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        qrCodeUuid: true,
        videoUrl: true,
        status: true,
        updatedAt: true,
      },
    });

    return successResponse(res, equipment, 'Equipment updated successfully');
  } catch (error: any) {
    console.error('Update equipment error:', error);
    return errorResponse(res, 'Failed to update equipment', 500);
  }
};

/**
 * Delete equipment (soft delete)
 */
export const deleteEquipment = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { id } = req.params;

    // Verify equipment exists
    const existing = await prisma.equipment.findFirst({
      where: {
        id,
        gymId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            exercises: true,
          },
        },
      },
    });

    if (!existing) {
      return errorResponse(res, 'Equipment not found', 404);
    }

    // Check if equipment is used in exercises
    if (existing._count.exercises > 0) {
      return errorResponse(
        res,
        `Cannot delete equipment that is used in ${existing._count.exercises} exercise(s)`,
        400
      );
    }

    await prisma.equipment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return successResponse(res, null, 'Equipment deleted successfully');
  } catch (error: any) {
    console.error('Delete equipment error:', error);
    return errorResponse(res, 'Failed to delete equipment', 500);
  }
};

/**
 * Get equipment statistics
 */
export const getEquipmentStats = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;

    const [total, byStatus, withExercises] = await Promise.all([
      prisma.equipment.count({
        where: {
          gymId,
          deletedAt: null,
        },
      }),
      prisma.equipment.groupBy({
        by: ['status'],
        where: {
          gymId,
          deletedAt: null,
        },
        _count: true,
      }),
      prisma.equipment.count({
        where: {
          gymId,
          deletedAt: null,
          exercises: {
            some: {
              deletedAt: null,
            },
          },
        },
      }),
    ]);

    const statusCounts = byStatus.reduce((acc: any, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {});

    return successResponse(res, {
      total,
      active: statusCounts.active || 0,
      maintenance: statusCounts.maintenance || 0,
      broken: statusCounts.broken || 0,
      withExercises,
      withoutExercises: total - withExercises,
    });
  } catch (error: any) {
    console.error('Get equipment stats error:', error);
    return errorResponse(res, 'Failed to retrieve equipment statistics', 500);
  }
};

/**
 * Get equipment by QR code UUID (for QR scanning)
 */
export const getEquipmentByQR = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { qrCodeUuid } = req.params;

    const equipment = await prisma.equipment.findFirst({
      where: {
        qrCodeUuid,
        gymId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        videoUrl: true,
        status: true,
      },
    });

    if (!equipment) {
      return errorResponse(res, 'Equipment not found', 404);
    }

    if (equipment.status === 'broken') {
      return successResponse(res, {
        ...equipment,
        warning: 'This equipment is currently out of service',
      });
    }

    if (equipment.status === 'maintenance') {
      return successResponse(res, {
        ...equipment,
        warning: 'This equipment is under maintenance',
      });
    }

    return successResponse(res, equipment);
  } catch (error: any) {
    console.error('Get equipment by QR error:', error);
    return errorResponse(res, 'Failed to retrieve equipment', 500);
  }
};

/**
 * Generate QR code image for equipment
 */
export const generateQRCode = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { id } = req.params;

    // Verify equipment exists
    const equipment = await prisma.equipment.findFirst({
      where: {
        id,
        gymId,
        deletedAt: null,
      },
      select: {
        qrCodeUuid: true,
        name: true,
      },
    });

    if (!equipment) {
      return errorResponse(res, 'Equipment not found', 404);
    }

    // Generate QR code as data URL (base64)
    const qrCodeDataURL = await QRCode.toDataURL(equipment.qrCodeUuid, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2,
    });

    return successResponse(res, {
      equipmentId: id,
      equipmentName: equipment.name,
      qrCodeUuid: equipment.qrCodeUuid,
      qrCodeImage: qrCodeDataURL,
    });
  } catch (error: any) {
    console.error('Generate QR code error:', error);
    return errorResponse(res, 'Failed to generate QR code', 500);
  }
};
