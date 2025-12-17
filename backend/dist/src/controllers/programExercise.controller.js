"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderProgramExercises = exports.removeExerciseFromProgram = exports.updateProgramExercise = exports.addExerciseToProgram = exports.getProgramExerciseById = exports.getProgramExercises = void 0;
const client_1 = require("@prisma/client");
const response_1 = require("../utils/response");
const prisma = new client_1.PrismaClient();
const getProgramExercises = async (req, res) => {
    try {
        const { gymId } = req.user;
        const { programId } = req.params;
        const program = await prisma.workoutProgram.findFirst({
            where: {
                id: programId,
                gymId,
                deletedAt: null,
            },
        });
        if (!program) {
            return (0, response_1.errorResponse)(res, 'Program not found', 404);
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
        return (0, response_1.successResponse)(res, exercises);
    }
    catch (error) {
        console.error('Get program exercises error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to retrieve program exercises', 500);
    }
};
exports.getProgramExercises = getProgramExercises;
const getProgramExerciseById = async (req, res) => {
    try {
        const { gymId } = req.user;
        const { programId, id } = req.params;
        const program = await prisma.workoutProgram.findFirst({
            where: {
                id: programId,
                gymId,
                deletedAt: null,
            },
        });
        if (!program) {
            return (0, response_1.errorResponse)(res, 'Program not found', 404);
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
            return (0, response_1.errorResponse)(res, 'Program exercise not found', 404);
        }
        return (0, response_1.successResponse)(res, programExercise);
    }
    catch (error) {
        console.error('Get program exercise by ID error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to retrieve program exercise', 500);
    }
};
exports.getProgramExerciseById = getProgramExerciseById;
const addExerciseToProgram = async (req, res) => {
    try {
        const { gymId } = req.user;
        const { programId } = req.params;
        const { exerciseId, sets, reps, restTimeSeconds, notes, orderIndex } = req.body;
        const program = await prisma.workoutProgram.findFirst({
            where: {
                id: programId,
                gymId,
                deletedAt: null,
            },
        });
        if (!program) {
            return (0, response_1.errorResponse)(res, 'Program not found', 404);
        }
        const exercise = await prisma.exercise.findFirst({
            where: {
                id: exerciseId,
                gymId,
                deletedAt: null,
            },
        });
        if (!exercise) {
            return (0, response_1.errorResponse)(res, 'Exercise not found in your gym', 404);
        }
        const existingProgramExercise = await prisma.programExercise.findFirst({
            where: {
                programId,
                exerciseId,
                deletedAt: null,
            },
        });
        if (existingProgramExercise) {
            return (0, response_1.errorResponse)(res, 'Exercise already exists in this program', 409);
        }
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
        }
        else {
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
        return (0, response_1.successResponse)(res, programExercise, 'Exercise added to program successfully', 201);
    }
    catch (error) {
        console.error('Add exercise to program error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to add exercise to program', 500);
    }
};
exports.addExerciseToProgram = addExerciseToProgram;
const updateProgramExercise = async (req, res) => {
    try {
        const { gymId } = req.user;
        const { programId, id } = req.params;
        const { sets, reps, restTimeSeconds, notes, orderIndex } = req.body;
        const program = await prisma.workoutProgram.findFirst({
            where: {
                id: programId,
                gymId,
                deletedAt: null,
            },
        });
        if (!program) {
            return (0, response_1.errorResponse)(res, 'Program not found', 404);
        }
        const existingProgramExercise = await prisma.programExercise.findFirst({
            where: {
                id,
                programId,
                deletedAt: null,
            },
        });
        if (!existingProgramExercise) {
            return (0, response_1.errorResponse)(res, 'Program exercise not found', 404);
        }
        if (orderIndex !== undefined && orderIndex !== existingProgramExercise.orderIndex) {
            const oldIndex = existingProgramExercise.orderIndex;
            const newIndex = orderIndex;
            if (newIndex > oldIndex) {
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
            }
            else {
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
        const updateData = {};
        if (sets !== undefined)
            updateData.sets = sets;
        if (reps !== undefined)
            updateData.reps = reps;
        if (restTimeSeconds !== undefined)
            updateData.restTimeSeconds = restTimeSeconds;
        if (notes !== undefined)
            updateData.notes = notes;
        if (orderIndex !== undefined)
            updateData.orderIndex = orderIndex;
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
        return (0, response_1.successResponse)(res, programExercise, 'Program exercise updated successfully');
    }
    catch (error) {
        console.error('Update program exercise error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to update program exercise', 500);
    }
};
exports.updateProgramExercise = updateProgramExercise;
const removeExerciseFromProgram = async (req, res) => {
    try {
        const { gymId } = req.user;
        const { programId, id } = req.params;
        const program = await prisma.workoutProgram.findFirst({
            where: {
                id: programId,
                gymId,
                deletedAt: null,
            },
        });
        if (!program) {
            return (0, response_1.errorResponse)(res, 'Program not found', 404);
        }
        const programExercise = await prisma.programExercise.findFirst({
            where: {
                id,
                programId,
                deletedAt: null,
            },
        });
        if (!programExercise) {
            return (0, response_1.errorResponse)(res, 'Program exercise not found', 404);
        }
        await prisma.programExercise.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
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
        return (0, response_1.successResponse)(res, null, 'Exercise removed from program successfully');
    }
    catch (error) {
        console.error('Remove exercise from program error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to remove exercise from program', 500);
    }
};
exports.removeExerciseFromProgram = removeExerciseFromProgram;
const reorderProgramExercises = async (req, res) => {
    try {
        const { gymId } = req.user;
        const { programId } = req.params;
        const { exerciseOrders } = req.body;
        const program = await prisma.workoutProgram.findFirst({
            where: {
                id: programId,
                gymId,
                deletedAt: null,
            },
        });
        if (!program) {
            return (0, response_1.errorResponse)(res, 'Program not found', 404);
        }
        const exerciseIds = exerciseOrders.map((e) => e.id);
        const exercises = await prisma.programExercise.findMany({
            where: {
                id: { in: exerciseIds },
                programId,
                deletedAt: null,
            },
        });
        if (exercises.length !== exerciseIds.length) {
            return (0, response_1.errorResponse)(res, 'Some exercises not found in this program', 404);
        }
        await prisma.$transaction(exerciseOrders.map((item) => prisma.programExercise.update({
            where: { id: item.id },
            data: { orderIndex: item.orderIndex },
        })));
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
        return (0, response_1.successResponse)(res, updatedExercises, 'Exercise order updated successfully');
    }
    catch (error) {
        console.error('Reorder program exercises error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to reorder exercises', 500);
    }
};
exports.reorderProgramExercises = reorderProgramExercises;
//# sourceMappingURL=programExercise.controller.js.map