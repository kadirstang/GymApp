import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '../utils/response';

const prisma = new PrismaClient();

/**
 * Get all exercises in a program
 */
export const getProgramExercises = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { programId } = req.params;

    // Verify program exists and belongs to gym
    const program = await prisma.workoutProgram.findFirst({
      where: {
        id: programId,
        gymId,
        deletedAt: null,
      },
    });

    if (!program) {
      return errorResponse(res, 'Program not found', 404);
    }

    const exercises = await prisma.programExercise.findMany({
      where: {
        programId,
        deletedAt: null,
      },
      orderBy: { orderIndex: 'asc' },
      include: {
        exercise: {
          select: {
            id: true,
            name: true,
            description: true,
            videoUrl: true,
            targetMuscleGroup: true,
            equipment: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return successResponse(res, exercises);
  } catch (error: any) {
    console.error('Get program exercises error:', error);
    return errorResponse(res, 'Failed to retrieve program exercises', 500);
  }
};

/**
 * Get single program exercise by ID
 */
export const getProgramExerciseById = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { programId, id } = req.params;

    // Verify program exists and belongs to gym
    const program = await prisma.workoutProgram.findFirst({
      where: {
        id: programId,
        gymId,
        deletedAt: null,
      },
    });

    if (!program) {
      return errorResponse(res, 'Program not found', 404);
    }

    const programExercise = await prisma.programExercise.findFirst({
      where: {
        id,
        programId,
        deletedAt: null,
      },
      include: {
        exercise: {
          select: {
            id: true,
            name: true,
            description: true,
            videoUrl: true,
            targetMuscleGroup: true,
            equipment: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!programExercise) {
      return errorResponse(res, 'Program exercise not found', 404);
    }

    return successResponse(res, programExercise);
  } catch (error: any) {
    console.error('Get program exercise by ID error:', error);
    return errorResponse(res, 'Failed to retrieve program exercise', 500);
  }
};

/**
 * Add exercise to program
 */
export const addExerciseToProgram = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { programId } = req.params;
    const { exerciseId, sets, reps, restTimeSeconds, notes, orderIndex } = req.body;

    // Verify program exists and belongs to gym
    const program = await prisma.workoutProgram.findFirst({
      where: {
        id: programId,
        gymId,
        deletedAt: null,
      },
    });

    if (!program) {
      return errorResponse(res, 'Program not found', 404);
    }

    // Verify exercise exists and belongs to gym
    const exercise = await prisma.exercise.findFirst({
      where: {
        id: exerciseId,
        gymId,
        deletedAt: null,
      },
    });

    if (!exercise) {
      return errorResponse(res, 'Exercise not found in your gym', 404);
    }

    // Check if exercise already exists in program
    const existingProgramExercise = await prisma.programExercise.findFirst({
      where: {
        programId,
        exerciseId,
        deletedAt: null,
      },
    });

    if (existingProgramExercise) {
      return errorResponse(res, 'Exercise already exists in this program', 409);
    }

    // If orderIndex not provided, add to end
    let finalOrderIndex = orderIndex;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const lastExercise = await prisma.programExercise.findFirst({
        where: {
          programId,
          deletedAt: null,
        },
        orderBy: { orderIndex: 'desc' },
      });
      finalOrderIndex = lastExercise ? lastExercise.orderIndex + 1 : 0;
    } else {
      // If specific orderIndex provided, shift existing exercises
      await prisma.programExercise.updateMany({
        where: {
          programId,
          orderIndex: { gte: finalOrderIndex },
          deletedAt: null,
        },
        data: {
          orderIndex: { increment: 1 },
        },
      });
    }

    const programExercise = await prisma.programExercise.create({
      data: {
        programId,
        exerciseId,
        orderIndex: finalOrderIndex,
        sets,
        reps,
        restTimeSeconds: restTimeSeconds || null,
        notes: notes || null,
      },
      include: {
        exercise: {
          select: {
            id: true,
            name: true,
            description: true,
            videoUrl: true,
            targetMuscleGroup: true,
            equipment: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return successResponse(res, programExercise, 'Exercise added to program successfully', 201);
  } catch (error: any) {
    console.error('Add exercise to program error:', error);
    return errorResponse(res, 'Failed to add exercise to program', 500);
  }
};

/**
 * Update program exercise
 */
export const updateProgramExercise = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { programId, id } = req.params;
    const { sets, reps, restTimeSeconds, notes, orderIndex } = req.body;

    // Verify program exists and belongs to gym
    const program = await prisma.workoutProgram.findFirst({
      where: {
        id: programId,
        gymId,
        deletedAt: null,
      },
    });

    if (!program) {
      return errorResponse(res, 'Program not found', 404);
    }

    // Check if program exercise exists
    const existingProgramExercise = await prisma.programExercise.findFirst({
      where: {
        id,
        programId,
        deletedAt: null,
      },
    });

    if (!existingProgramExercise) {
      return errorResponse(res, 'Program exercise not found', 404);
    }

    // If orderIndex is being changed, handle reordering
    if (orderIndex !== undefined && orderIndex !== existingProgramExercise.orderIndex) {
      const oldIndex = existingProgramExercise.orderIndex;
      const newIndex = orderIndex;

      if (newIndex > oldIndex) {
        // Moving down: shift items between old and new position up
        await prisma.programExercise.updateMany({
          where: {
            programId,
            orderIndex: {
              gt: oldIndex,
              lte: newIndex,
            },
            deletedAt: null,
          },
          data: {
            orderIndex: { decrement: 1 },
          },
        });
      } else {
        // Moving up: shift items between new and old position down
        await prisma.programExercise.updateMany({
          where: {
            programId,
            orderIndex: {
              gte: newIndex,
              lt: oldIndex,
            },
            deletedAt: null,
          },
          data: {
            orderIndex: { increment: 1 },
          },
        });
      }
    }

    const updateData: any = {};
    if (sets !== undefined) updateData.sets = sets;
    if (reps !== undefined) updateData.reps = reps;
    if (restTimeSeconds !== undefined) updateData.restTimeSeconds = restTimeSeconds;
    if (notes !== undefined) updateData.notes = notes;
    if (orderIndex !== undefined) updateData.orderIndex = orderIndex;

    const programExercise = await prisma.programExercise.update({
      where: { id },
      data: updateData,
      include: {
        exercise: {
          select: {
            id: true,
            name: true,
            description: true,
            videoUrl: true,
            targetMuscleGroup: true,
            equipment: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return successResponse(res, programExercise, 'Program exercise updated successfully');
  } catch (error: any) {
    console.error('Update program exercise error:', error);
    return errorResponse(res, 'Failed to update program exercise', 500);
  }
};

/**
 * Remove exercise from program (soft delete)
 */
export const removeExerciseFromProgram = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { programId, id } = req.params;

    // Verify program exists and belongs to gym
    const program = await prisma.workoutProgram.findFirst({
      where: {
        id: programId,
        gymId,
        deletedAt: null,
      },
    });

    if (!program) {
      return errorResponse(res, 'Program not found', 404);
    }

    // Check if program exercise exists
    const programExercise = await prisma.programExercise.findFirst({
      where: {
        id,
        programId,
        deletedAt: null,
      },
    });

    if (!programExercise) {
      return errorResponse(res, 'Program exercise not found', 404);
    }

    // Soft delete
    await prisma.programExercise.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Reorder remaining exercises to fill the gap
    await prisma.programExercise.updateMany({
      where: {
        programId,
        orderIndex: { gt: programExercise.orderIndex },
        deletedAt: null,
      },
      data: {
        orderIndex: { decrement: 1 },
      },
    });

    return successResponse(res, null, 'Exercise removed from program successfully');
  } catch (error: any) {
    console.error('Remove exercise from program error:', error);
    return errorResponse(res, 'Failed to remove exercise from program', 500);
  }
};

/**
 * Reorder exercises in program
 */
export const reorderProgramExercises = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { programId } = req.params;
    const { exerciseOrders } = req.body; // Array of { id, orderIndex }

    // Verify program exists and belongs to gym
    const program = await prisma.workoutProgram.findFirst({
      where: {
        id: programId,
        gymId,
        deletedAt: null,
      },
    });

    if (!program) {
      return errorResponse(res, 'Program not found', 404);
    }

    // Verify all exercises belong to this program
    const exerciseIds = exerciseOrders.map((e: any) => e.id);
    const exercises = await prisma.programExercise.findMany({
      where: {
        id: { in: exerciseIds },
        programId,
        deletedAt: null,
      },
    });

    if (exercises.length !== exerciseIds.length) {
      return errorResponse(res, 'Some exercises not found in this program', 404);
    }

    // Update all order indices in a transaction
    await prisma.$transaction(
      exerciseOrders.map((item: any) =>
        prisma.programExercise.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex },
        })
      )
    );

    const updatedExercises = await prisma.programExercise.findMany({
      where: {
        programId,
        deletedAt: null,
      },
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
    });

    return successResponse(res, updatedExercises, 'Exercise order updated successfully');
  } catch (error: any) {
    console.error('Reorder program exercises error:', error);
    return errorResponse(res, 'Failed to reorder exercises', 500);
  }
};
