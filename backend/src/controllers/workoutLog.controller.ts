import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '../utils/response';

const prisma = new PrismaClient();

/**
 * Get all workout logs for a user with filtering
 */
export const getWorkoutLogs = async (req: Request, res: Response) => {
  try {
    const { gymId, userId, role } = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const programId = req.query.programId as string;
    const targetUserId = req.query.userId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    // Build where clause
    const where: any = {
      deletedAt: null,
      user: {
        gymId,
        deletedAt: null,
      },
    };

    // Role-based filtering
    if (role.name === 'Trainer') {
      // Trainers can only see their students' workout logs
      const trainerMatches = await prisma.trainerMatch.findMany({
        where: {
          trainerId: userId,
          status: 'active',
          deletedAt: null,
        },
        select: { studentId: true },
      });

      const studentIds = trainerMatches.map(m => m.studentId);

      // If a specific user is requested, check if they're the trainer's student
      if (targetUserId) {
        if (!studentIds.includes(targetUserId)) {
          return errorResponse(res, 'You can only view workout logs of your students', 403);
        }
        where.userId = targetUserId;
      } else {
        // Show all students' logs
        where.userId = { in: studentIds };
      }
    } else {
      // GymOwner can see all users
      if (targetUserId) {
        where.userId = targetUserId;
      }
      // If no targetUserId, show all (don't restrict to own userId)
    }

    if (programId) {
      where.programId = programId;
    }

    if (startDate) {
      where.startedAt = {
        ...(where.startedAt || {}),
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      where.startedAt = {
        ...(where.startedAt || {}),
        lte: new Date(endDate),
      };
    }

    const [logs, total] = await Promise.all([
      prisma.workoutLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          program: {
            select: {
              id: true,
              name: true,
              difficultyLevel: true,
            },
          },
          _count: {
            select: {
              entries: true,
            },
          },
        },
      }),
      prisma.workoutLog.count({ where }),
    ]);

    return successResponse(res, {
      items: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get workout logs error:', error);
    return errorResponse(res, 'Failed to retrieve workout logs', 500);
  }
};

/**
 * Get single workout log by ID with all entries
 */
export const getWorkoutLogById = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { id } = req.params;

    const log = await prisma.workoutLog.findFirst({
      where: {
        id,
        deletedAt: null,
        user: {
          gymId,
          deletedAt: null,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        program: {
          select: {
            id: true,
            name: true,
            description: true,
            difficultyLevel: true,
          },
        },
        entries: {
          where: { deletedAt: null },
          orderBy: [
            { exerciseId: 'asc' },
            { setNumber: 'asc' },
          ],
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                description: true,
                targetMuscleGroup: true,
              },
            },
          },
        },
      },
    });

    if (!log) {
      return errorResponse(res, 'Workout log not found', 404);
    }

    return successResponse(res, log);
  } catch (error: any) {
    console.error('Get workout log by ID error:', error);
    return errorResponse(res, 'Failed to retrieve workout log', 500);
  }
};

/**
 * Start a new workout session
 */
export const startWorkout = async (req: Request, res: Response) => {
  try {
    const { gymId, userId } = req.user!;
    const { programId, notes } = req.body;

    // Verify program exists and is accessible
    const program = await prisma.workoutProgram.findFirst({
      where: {
        id: programId,
        gymId,
        deletedAt: null,
        OR: [
          { creatorId: userId },
          { assignedUserId: userId },
        ],
      },
    });

    if (!program) {
      return errorResponse(res, 'Program not found or not accessible', 404);
    }

    // Check if user has an active (unfinished) workout
    const activeWorkout = await prisma.workoutLog.findFirst({
      where: {
        userId,
        endedAt: null,
        deletedAt: null,
      },
    });

    if (activeWorkout) {
      return errorResponse(res, 'You have an active workout. Please finish it before starting a new one.', 409);
    }

    const workoutLog = await prisma.workoutLog.create({
      data: {
        userId,
        programId,
        startedAt: new Date(),
        notes: notes || null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        program: {
          select: {
            id: true,
            name: true,
            difficultyLevel: true,
          },
        },
      },
    });

    return successResponse(res, workoutLog, 'Workout started successfully', 201);
  } catch (error: any) {
    console.error('Start workout error:', error);
    return errorResponse(res, 'Failed to start workout', 500);
  }
};

/**
 * End/finish a workout session
 */
export const endWorkout = async (req: Request, res: Response) => {
  try {
    const { gymId, userId } = req.user!;
    const { id } = req.params;
    const { notes } = req.body;

    // Verify workout exists and belongs to user
    const workoutLog = await prisma.workoutLog.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
        user: {
          gymId,
          deletedAt: null,
        },
      },
    });

    if (!workoutLog) {
      return errorResponse(res, 'Workout log not found', 404);
    }

    if (workoutLog.endedAt) {
      return errorResponse(res, 'Workout has already been finished', 400);
    }

    const updatedLog = await prisma.workoutLog.update({
      where: { id },
      data: {
        endedAt: new Date(),
        notes: notes !== undefined ? notes : workoutLog.notes,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        program: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });

    return successResponse(res, updatedLog, 'Workout finished successfully');
  } catch (error: any) {
    console.error('End workout error:', error);
    return errorResponse(res, 'Failed to finish workout', 500);
  }
};

/**
 * Add a set entry to workout log
 */
export const logSet = async (req: Request, res: Response) => {
  try {
    const { gymId, userId } = req.user!;
    const { workoutLogId } = req.params;
    const { exerciseId, setNumber, weightKg, repsCompleted, rpe } = req.body;

    // Verify workout log exists and belongs to user
    const workoutLog = await prisma.workoutLog.findFirst({
      where: {
        id: workoutLogId,
        userId,
        deletedAt: null,
        user: {
          gymId,
          deletedAt: null,
        },
      },
    });

    if (!workoutLog) {
      return errorResponse(res, 'Workout log not found', 404);
    }

    if (workoutLog.endedAt) {
      return errorResponse(res, 'Cannot add sets to a finished workout', 400);
    }

    // Verify exercise exists in the program
    const programExercise = await prisma.programExercise.findFirst({
      where: {
        programId: workoutLog.programId,
        exerciseId,
        deletedAt: null,
      },
    });

    if (!programExercise) {
      return errorResponse(res, 'Exercise not found in this program', 404);
    }

    const entry = await prisma.workoutLogEntry.create({
      data: {
        workoutLogId,
        exerciseId,
        setNumber,
        weightKg: weightKg || null,
        repsCompleted,
        rpe: rpe || null,
      },
      include: {
        exercise: {
          select: {
            id: true,
            name: true,
            targetMuscleGroup: true,
          },
        },
      },
    });

    return successResponse(res, entry, 'Set logged successfully', 201);
  } catch (error: any) {
    console.error('Log set error:', error);
    return errorResponse(res, 'Failed to log set', 500);
  }
};

/**
 * Update a set entry
 */
export const updateSetEntry = async (req: Request, res: Response) => {
  try {
    const { gymId, userId } = req.user!;
    const { workoutLogId, entryId } = req.params;
    const { weightKg, repsCompleted, rpe } = req.body;

    // Verify workout log exists and belongs to user
    const workoutLog = await prisma.workoutLog.findFirst({
      where: {
        id: workoutLogId,
        userId,
        deletedAt: null,
        user: {
          gymId,
          deletedAt: null,
        },
      },
    });

    if (!workoutLog) {
      return errorResponse(res, 'Workout log not found', 404);
    }

    if (workoutLog.endedAt) {
      return errorResponse(res, 'Cannot update sets in a finished workout', 400);
    }

    // Verify entry exists and belongs to this workout
    const existingEntry = await prisma.workoutLogEntry.findFirst({
      where: {
        id: entryId,
        workoutLogId,
        deletedAt: null,
      },
    });

    if (!existingEntry) {
      return errorResponse(res, 'Set entry not found', 404);
    }

    const updateData: any = {};
    if (weightKg !== undefined) updateData.weightKg = weightKg;
    if (repsCompleted !== undefined) updateData.repsCompleted = repsCompleted;
    if (rpe !== undefined) updateData.rpe = rpe;

    const entry = await prisma.workoutLogEntry.update({
      where: { id: entryId },
      data: updateData,
      include: {
        exercise: {
          select: {
            id: true,
            name: true,
            targetMuscleGroup: true,
          },
        },
      },
    });

    return successResponse(res, entry, 'Set entry updated successfully');
  } catch (error: any) {
    console.error('Update set entry error:', error);
    return errorResponse(res, 'Failed to update set entry', 500);
  }
};

/**
 * Delete a set entry
 */
export const deleteSetEntry = async (req: Request, res: Response) => {
  try {
    const { gymId, userId } = req.user!;
    const { workoutLogId, entryId } = req.params;

    // Verify workout log exists and belongs to user
    const workoutLog = await prisma.workoutLog.findFirst({
      where: {
        id: workoutLogId,
        userId,
        deletedAt: null,
        user: {
          gymId,
          deletedAt: null,
        },
      },
    });

    if (!workoutLog) {
      return errorResponse(res, 'Workout log not found', 404);
    }

    if (workoutLog.endedAt) {
      return errorResponse(res, 'Cannot delete sets from a finished workout', 400);
    }

    // Verify entry exists and belongs to this workout
    const entry = await prisma.workoutLogEntry.findFirst({
      where: {
        id: entryId,
        workoutLogId,
        deletedAt: null,
      },
    });

    if (!entry) {
      return errorResponse(res, 'Set entry not found', 404);
    }

    // Soft delete
    await prisma.workoutLogEntry.update({
      where: { id: entryId },
      data: { deletedAt: new Date() },
    });

    return successResponse(res, null, 'Set entry deleted successfully');
  } catch (error: any) {
    console.error('Delete set entry error:', error);
    return errorResponse(res, 'Failed to delete set entry', 500);
  }
};

/**
 * Get workout statistics/progress for a user
 */
export const getWorkoutStats = async (req: Request, res: Response) => {
  try {
    const { gymId, userId } = req.user!;
    const targetUserId = req.query.userId as string || userId;

    // Verify target user belongs to same gym
    const targetUser = await prisma.user.findFirst({
      where: {
        id: targetUserId,
        gymId,
        deletedAt: null,
      },
    });

    if (!targetUser) {
      return errorResponse(res, 'User not found', 404);
    }

    const [totalWorkouts, completedWorkouts, totalSets, recentWorkouts] = await Promise.all([
      prisma.workoutLog.count({
        where: {
          userId: targetUserId,
          deletedAt: null,
        },
      }),
      prisma.workoutLog.count({
        where: {
          userId: targetUserId,
          endedAt: { not: null },
          deletedAt: null,
        },
      }),
      prisma.workoutLogEntry.count({
        where: {
          workoutLog: {
            userId: targetUserId,
            deletedAt: null,
          },
          deletedAt: null,
        },
      }),
      prisma.workoutLog.findMany({
        where: {
          userId: targetUserId,
          deletedAt: null,
        },
        take: 10,
        orderBy: { startedAt: 'desc' },
        select: {
          id: true,
          startedAt: true,
          endedAt: true,
          program: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              entries: true,
            },
          },
        },
      }),
    ]);

    return successResponse(res, {
      totalWorkouts,
      completedWorkouts,
      activeWorkouts: totalWorkouts - completedWorkouts,
      totalSets,
      recentWorkouts,
    });
  } catch (error: any) {
    console.error('Get workout stats error:', error);
    return errorResponse(res, 'Failed to retrieve workout statistics', 500);
  }
};

/**
 * Get active (unfinished) workout for user
 */
export const getActiveWorkout = async (req: Request, res: Response) => {
  try {
    const { gymId, userId } = req.user!;

    const activeWorkout = await prisma.workoutLog.findFirst({
      where: {
        userId,
        endedAt: null,
        deletedAt: null,
        user: {
          gymId,
          deletedAt: null,
        },
      },
      include: {
        program: {
          select: {
            id: true,
            name: true,
            difficultyLevel: true,
          },
        },
        entries: {
          where: { deletedAt: null },
          orderBy: [
            { exerciseId: 'asc' },
            { setNumber: 'asc' },
          ],
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

    if (!activeWorkout) {
      return successResponse(res, null, 'No active workout found');
    }

    return successResponse(res, activeWorkout);
  } catch (error: any) {
    console.error('Get active workout error:', error);
    return errorResponse(res, 'Failed to retrieve active workout', 500);
  }
};
