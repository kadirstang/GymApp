import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '../utils/response.js';

const prisma = new PrismaClient();

/**
 * Get all exercises for the gym (paginated)
 * Query params: page, limit, search, targetMuscleGroup, equipmentNeededId
 */
export const getExercises = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const targetMuscleGroup = req.query.targetMuscleGroup as string;
    const equipmentNeededId = req.query.equipmentNeededId as string;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      gymId,
      deletedAt: null
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (targetMuscleGroup) {
      where.targetMuscleGroup = targetMuscleGroup;
    }

    if (equipmentNeededId) {
      where.equipmentNeededId = equipmentNeededId;
    }

    // Get exercises with pagination
    const [exercises, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          equipment: {
            select: {
              id: true,
              name: true,
              status: true
            }
          },
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      prisma.exercise.count({ where })
    ]);

    return successResponse(res, {
      items: exercises,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Get exercises error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get exercise by ID
 */
export const getExerciseById = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { id } = req.params;

    const exercise = await prisma.exercise.findFirst({
      where: {
        id,
        gymId,
        deletedAt: null
      },
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true
          }
        },
        _count: {
          select: {
            programExercises: true,
            workoutLogEntries: true
          }
        }
      }
    });

    if (!exercise) {
      return errorResponse(res, 'Exercise not found', 404);
    }

    return successResponse(res, exercise);
  } catch (error: any) {
    console.error('Get exercise error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Create new exercise
 */
export const createExercise = async (req: Request, res: Response) => {
  try {
    const { gymId, userId } = req.user!;
    const {
      name,
      description,
      videoUrl,
      targetMuscleGroup,
      equipmentNeededId
    } = req.body;

    // Verify equipment belongs to same gym if provided
    if (equipmentNeededId) {
      const equipment = await prisma.equipment.findFirst({
        where: {
          id: equipmentNeededId,
          gymId,
          deletedAt: null
        }
      });

      if (!equipment) {
        return errorResponse(res, 'Equipment not found or does not belong to your gym', 404);
      }
    }

    // Check for duplicate exercise name in gym
    const existingExercise = await prisma.exercise.findFirst({
      where: {
        gymId,
        name: { equals: name, mode: 'insensitive' },
        deletedAt: null
      }
    });

    if (existingExercise) {
      return errorResponse(res, 'Exercise with this name already exists in your gym', 409);
    }

    const exercise = await prisma.exercise.create({
      data: {
        gymId,
        createdBy: userId,
        name,
        description,
        videoUrl,
        targetMuscleGroup,
        equipmentNeededId
      },
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });

    return successResponse(res, exercise, 'Exercise created successfully', 201);
  } catch (error: any) {
    console.error('Create exercise error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Update exercise
 */
export const updateExercise = async (req: Request, res: Response) => {
  try {
    const { gymId, userId, role } = req.user!;
    const { id } = req.params;
    const {
      name,
      description,
      videoUrl,
      targetMuscleGroup,
      equipmentNeededId
    } = req.body;

    // Check if exercise exists and belongs to gym
    const existingExercise = await prisma.exercise.findFirst({
      where: {
        id,
        gymId,
        deletedAt: null
      }
    });

    if (!existingExercise) {
      return errorResponse(res, 'Exercise not found', 404);
    }

    // Permission check: Trainers can only edit their own exercises
    if (role.name === 'Trainer' && existingExercise.createdBy !== userId) {
      return errorResponse(res, 'You can only edit exercises created by you', 403);
    }

    // Verify equipment belongs to same gym if provided
    if (equipmentNeededId) {
      const equipment = await prisma.equipment.findFirst({
        where: {
          id: equipmentNeededId,
          gymId,
          deletedAt: null
        }
      });

      if (!equipment) {
        return errorResponse(res, 'Equipment not found or does not belong to your gym', 404);
      }
    }

    // Check for duplicate name (excluding current exercise)
    if (name) {
      const duplicateExercise = await prisma.exercise.findFirst({
        where: {
          gymId,
          name: { equals: name, mode: 'insensitive' },
          deletedAt: null,
          NOT: { id }
        }
      });

      if (duplicateExercise) {
        return errorResponse(res, 'Exercise with this name already exists in your gym', 409);
      }
    }

    const exercise = await prisma.exercise.update({
      where: { id },
      data: {
        name,
        description,
        videoUrl,
        targetMuscleGroup,
        equipmentNeededId
      },
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });

    return successResponse(res, exercise, 'Exercise updated successfully');
  } catch (error: any) {
    console.error('Update exercise error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Delete exercise (soft delete)
 */
export const deleteExercise = async (req: Request, res: Response) => {
  try {
    const { gymId, userId, role } = req.user!;
    const { id } = req.params;

    // Check if exercise exists and belongs to gym
    const exercise = await prisma.exercise.findFirst({
      where: {
        id,
        gymId,
        deletedAt: null
      }
    });

    if (!exercise) {
      return errorResponse(res, 'Exercise not found', 404);
    }

    // Permission check: Trainers can only delete their own exercises
    if (role.name === 'Trainer' && exercise.createdBy !== userId) {
      return errorResponse(res, 'You can only delete exercises created by you', 403);
    }

    // Check if exercise is used in any active (non-deleted) programs
    const activeProgramExercises = await prisma.programExercise.count({
      where: {
        exerciseId: id,
        deletedAt: null,
        program: {
          deletedAt: null
        }
      }
    });

    if (activeProgramExercises > 0) {
      return errorResponse(
        res,
        `Cannot delete exercise. It is used in ${activeProgramExercises} active workout program(s)`,
        400
      );
    }

    // Soft delete
    await prisma.exercise.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return successResponse(res, null, 'Exercise deleted successfully');
  } catch (error: any) {
    console.error('Delete exercise error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get muscle group list (distinct values from exercises)
 */
export const getMuscleGroups = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;

    const exercises = await prisma.exercise.findMany({
      where: {
        gymId,
        deletedAt: null,
        targetMuscleGroup: { not: null }
      },
      select: {
        targetMuscleGroup: true
      },
      distinct: ['targetMuscleGroup']
    });

    const muscleGroups = exercises
      .map(e => e.targetMuscleGroup)
      .filter((value): value is string => value !== null)
      .sort();

    return successResponse(res, {
      muscleGroups,
      total: muscleGroups.length
    });
  } catch (error: any) {
    console.error('Get muscle groups error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get exercise statistics
 */
export const getExerciseStats = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;

    const [
      totalExercises,
      exercisesWithVideo,
      exercisesWithEquipment,
      muscleGroupCount
    ] = await Promise.all([
      prisma.exercise.count({
        where: { gymId, deletedAt: null }
      }),
      prisma.exercise.count({
        where: {
          gymId,
          deletedAt: null,
          videoUrl: { not: null }
        }
      }),
      prisma.exercise.count({
        where: {
          gymId,
          deletedAt: null,
          equipmentNeededId: { not: null }
        }
      }),
      prisma.exercise.findMany({
        where: {
          gymId,
          deletedAt: null,
          targetMuscleGroup: { not: null }
        },
        select: { targetMuscleGroup: true },
        distinct: ['targetMuscleGroup']
      })
    ]);

    return successResponse(res, {
      totalExercises,
      exercisesWithVideo,
      exercisesWithEquipment,
      uniqueMuscleGroups: muscleGroupCount.length
    });
  } catch (error: any) {
    console.error('Get exercise stats error:', error);
    return errorResponse(res, error.message, 500);
  }
};
