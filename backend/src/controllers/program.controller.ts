import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '../utils/response';

const prisma = new PrismaClient();

/**
 * Get all workout programs (with pagination, filtering)
 * Query params: page, limit, search, difficultyLevel, assignedUserId, creatorId
 */
export const getPrograms = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const search = req.query.search as string;
    const difficultyLevel = req.query.difficultyLevel as string;
    const assignedUserId = req.query.assignedUserId as string;
    const creatorId = req.query.creatorId as string;

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

    if (difficultyLevel) {
      where.difficultyLevel = difficultyLevel;
    }

    if (assignedUserId) {
      where.assignedUserId = assignedUserId;
    }

    if (creatorId) {
      where.creatorId = creatorId;
    }

    const [programs, total] = await Promise.all([
      prisma.workoutProgram.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignedUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              programExercises: true,
              workoutLogs: true,
            },
          },
        },
      }),
      prisma.workoutProgram.count({ where }),
    ]);

    return successResponse(res, {
      programs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get programs error:', error);
    return errorResponse(res, 'Failed to retrieve programs', 500);
  }
};

/**
 * Get single workout program by ID
 */
export const getProgramById = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { id } = req.params;

    const program = await prisma.workoutProgram.findFirst({
      where: {
        id,
        gymId,
        deletedAt: null,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        programExercises: {
          where: { deletedAt: null },
          orderBy: { orderIndex: 'asc' },
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                description: true,
                videoUrl: true,
                targetMuscleGroup: true,
              },
            },
          },
        },
        _count: {
          select: {
            workoutLogs: true,
          },
        },
      },
    });

    if (!program) {
      return errorResponse(res, 'Program not found', 404);
    }

    return successResponse(res, program);
  } catch (error: any) {
    console.error('Get program by ID error:', error);
    return errorResponse(res, 'Failed to retrieve program', 500);
  }
};

/**
 * Create new workout program
 */
export const createProgram = async (req: Request, res: Response) => {
  try {
    const { gymId, userId } = req.user!;
    const { name, description, difficultyLevel, assignedUserId } = req.body;

    // If assigning to a user, verify they belong to the same gym
    if (assignedUserId) {
      const assignedUser = await prisma.user.findFirst({
        where: {
          id: assignedUserId,
          gymId,
          deletedAt: null,
        },
      });

      if (!assignedUser) {
        return errorResponse(res, 'Assigned user not found in your gym', 404);
      }
    }

    const program = await prisma.workoutProgram.create({
      data: {
        gymId,
        creatorId: userId,
        name,
        description,
        difficultyLevel: difficultyLevel || 'Beginner',
        assignedUserId: assignedUserId || null,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return successResponse(res, program, 'Program created successfully', 201);
  } catch (error: any) {
    console.error('Create program error:', error);
    return errorResponse(res, 'Failed to create program', 500);
  }
};

/**
 * Update workout program
 */
export const updateProgram = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { id } = req.params;
    const { name, description, difficultyLevel, assignedUserId } = req.body;

    // Check if program exists and belongs to gym
    const existingProgram = await prisma.workoutProgram.findFirst({
      where: {
        id,
        gymId,
        deletedAt: null,
      },
    });

    if (!existingProgram) {
      return errorResponse(res, 'Program not found', 404);
    }

    // If updating assigned user, verify they belong to the same gym
    if (assignedUserId !== undefined) {
      if (assignedUserId !== null) {
        const assignedUser = await prisma.user.findFirst({
          where: {
            id: assignedUserId,
            gymId,
            deletedAt: null,
          },
        });

        if (!assignedUser) {
          return errorResponse(res, 'Assigned user not found in your gym', 404);
        }
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (difficultyLevel !== undefined) updateData.difficultyLevel = difficultyLevel;
    if (assignedUserId !== undefined) updateData.assignedUserId = assignedUserId;

    const program = await prisma.workoutProgram.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return successResponse(res, program, 'Program updated successfully');
  } catch (error: any) {
    console.error('Update program error:', error);
    return errorResponse(res, 'Failed to update program', 500);
  }
};

/**
 * Delete workout program (soft delete)
 */
export const deleteProgram = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { id } = req.params;

    // Check if program exists and belongs to gym
    const program = await prisma.workoutProgram.findFirst({
      where: {
        id,
        gymId,
        deletedAt: null,
      },
    });

    if (!program) {
      return errorResponse(res, 'Program not found', 404);
    }

    // Soft delete
    await prisma.workoutProgram.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return successResponse(res, null, 'Program deleted successfully');
  } catch (error: any) {
    console.error('Delete program error:', error);
    return errorResponse(res, 'Failed to delete program', 500);
  }
};

/**
 * Clone/copy workout program (template feature)
 */
export const cloneProgram = async (req: Request, res: Response) => {
  try {
    const { gymId, userId } = req.user!;
    const { id } = req.params;
    const { name, assignedUserId } = req.body;

    // Get source program with exercises
    const sourceProgram = await prisma.workoutProgram.findFirst({
      where: {
        id,
        gymId,
        deletedAt: null,
      },
      include: {
        programExercises: {
          where: { deletedAt: null },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!sourceProgram) {
      return errorResponse(res, 'Source program not found', 404);
    }

    // If assigning to a user, verify they belong to the same gym
    if (assignedUserId) {
      const assignedUser = await prisma.user.findFirst({
        where: {
          id: assignedUserId,
          gymId,
          deletedAt: null,
        },
      });

      if (!assignedUser) {
        return errorResponse(res, 'Assigned user not found in your gym', 404);
      }
    }

    // Create new program with copied exercises
    const newProgram = await prisma.workoutProgram.create({
      data: {
        gymId,
        creatorId: userId,
        name: name || `${sourceProgram.name} (Copy)`,
        description: sourceProgram.description,
        difficultyLevel: sourceProgram.difficultyLevel,
        assignedUserId: assignedUserId || null,
        programExercises: {
          create: sourceProgram.programExercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            orderIndex: ex.orderIndex,
            sets: ex.sets,
            reps: ex.reps,
            restTimeSeconds: ex.restTimeSeconds,
            notes: ex.notes,
          })),
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        programExercises: {
          orderBy: { orderIndex: 'asc' },
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                targetMuscleGroup: true,
              },
            },
          },
        },
      },
    });

    return successResponse(res, newProgram, 'Program cloned successfully', 201);
  } catch (error: any) {
    console.error('Clone program error:', error);
    return errorResponse(res, 'Failed to clone program', 500);
  }
};

/**
 * Get program statistics
 */
export const getProgramStats = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;

    const [total, byDifficulty, assigned, unassigned] = await Promise.all([
      prisma.workoutProgram.count({
        where: { gymId, deletedAt: null },
      }),
      prisma.workoutProgram.groupBy({
        by: ['difficultyLevel'],
        where: { gymId, deletedAt: null },
        _count: true,
      }),
      prisma.workoutProgram.count({
        where: { gymId, deletedAt: null, assignedUserId: { not: null } },
      }),
      prisma.workoutProgram.count({
        where: { gymId, deletedAt: null, assignedUserId: null },
      }),
    ]);

    const difficultyStats = byDifficulty.reduce((acc: any, item) => {
      acc[item.difficultyLevel] = item._count;
      return acc;
    }, {});

    return successResponse(res, {
      totalPrograms: total,
      assignedPrograms: assigned,
      unassignedPrograms: unassigned,
      byDifficulty: difficultyStats,
    });
  } catch (error: any) {
    console.error('Get program stats error:', error);
    return errorResponse(res, 'Failed to retrieve program statistics', 500);
  }
};
