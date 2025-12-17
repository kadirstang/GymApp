"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveWorkout = exports.getWorkoutStats = exports.deleteSetEntry = exports.updateSetEntry = exports.logSet = exports.endWorkout = exports.startWorkout = exports.getWorkoutLogById = exports.getWorkoutLogs = void 0;
const client_1 = require("@prisma/client");
const response_1 = require("../utils/response");
const prisma = new client_1.PrismaClient();
const getWorkoutLogs = async (req, res) => {
    try {
        const { gymId, userId, role } = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const programId = req.query.programId;
        const targetUserId = req.query.userId;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        const where = {
            deletedAt: null,
            user: {
                gymId,
                deletedAt: null,
            },
        };
        if (role.name === 'Trainer') {
            const trainerMatches = await prisma.trainerMatch.findMany({
                where: {
                    trainerId: userId,
                    status: 'active',
                    deletedAt: null,
                },
                select: { studentId: true },
            });
            const studentIds = trainerMatches.map(m => m.studentId);
            if (targetUserId) {
                if (!studentIds.includes(targetUserId)) {
                    return (0, response_1.errorResponse)(res, 'You can only view workout logs of your students', 403);
                }
                where.userId = targetUserId;
            }
            else {
                where.userId = { in: studentIds };
            }
        }
        else {
            if (targetUserId) {
                where.userId = targetUserId;
            }
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
        return (0, response_1.successResponse)(res, {
            items: logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error('Get workout logs error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to retrieve workout logs', 500);
    }
};
exports.getWorkoutLogs = getWorkoutLogs;
const getWorkoutLogById = async (req, res) => {
    try {
        const { gymId } = req.user;
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
            return (0, response_1.errorResponse)(res, 'Workout log not found', 404);
        }
        return (0, response_1.successResponse)(res, log);
    }
    catch (error) {
        console.error('Get workout log by ID error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to retrieve workout log', 500);
    }
};
exports.getWorkoutLogById = getWorkoutLogById;
const startWorkout = async (req, res) => {
    try {
        const { gymId, userId } = req.user;
        const { programId, notes } = req.body;
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
            return (0, response_1.errorResponse)(res, 'Program not found or not accessible', 404);
        }
        const activeWorkout = await prisma.workoutLog.findFirst({
            where: {
                userId,
                endedAt: null,
                deletedAt: null,
            },
        });
        if (activeWorkout) {
            return (0, response_1.errorResponse)(res, 'You have an active workout. Please finish it before starting a new one.', 409);
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
        return (0, response_1.successResponse)(res, workoutLog, 'Workout started successfully', 201);
    }
    catch (error) {
        console.error('Start workout error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to start workout', 500);
    }
};
exports.startWorkout = startWorkout;
const endWorkout = async (req, res) => {
    try {
        const { gymId, userId } = req.user;
        const { id } = req.params;
        const { notes } = req.body;
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
            return (0, response_1.errorResponse)(res, 'Workout log not found', 404);
        }
        if (workoutLog.endedAt) {
            return (0, response_1.errorResponse)(res, 'Workout has already been finished', 400);
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
        return (0, response_1.successResponse)(res, updatedLog, 'Workout finished successfully');
    }
    catch (error) {
        console.error('End workout error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to finish workout', 500);
    }
};
exports.endWorkout = endWorkout;
const logSet = async (req, res) => {
    try {
        const { gymId, userId } = req.user;
        const { workoutLogId } = req.params;
        const { exerciseId, setNumber, weightKg, repsCompleted, rpe } = req.body;
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
            return (0, response_1.errorResponse)(res, 'Workout log not found', 404);
        }
        if (workoutLog.endedAt) {
            return (0, response_1.errorResponse)(res, 'Cannot add sets to a finished workout', 400);
        }
        const programExercise = await prisma.programExercise.findFirst({
            where: {
                programId: workoutLog.programId,
                exerciseId,
                deletedAt: null,
            },
        });
        if (!programExercise) {
            return (0, response_1.errorResponse)(res, 'Exercise not found in this program', 404);
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
        return (0, response_1.successResponse)(res, entry, 'Set logged successfully', 201);
    }
    catch (error) {
        console.error('Log set error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to log set', 500);
    }
};
exports.logSet = logSet;
const updateSetEntry = async (req, res) => {
    try {
        const { gymId, userId } = req.user;
        const { workoutLogId, entryId } = req.params;
        const { weightKg, repsCompleted, rpe } = req.body;
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
            return (0, response_1.errorResponse)(res, 'Workout log not found', 404);
        }
        if (workoutLog.endedAt) {
            return (0, response_1.errorResponse)(res, 'Cannot update sets in a finished workout', 400);
        }
        const existingEntry = await prisma.workoutLogEntry.findFirst({
            where: {
                id: entryId,
                workoutLogId,
                deletedAt: null,
            },
        });
        if (!existingEntry) {
            return (0, response_1.errorResponse)(res, 'Set entry not found', 404);
        }
        const updateData = {};
        if (weightKg !== undefined)
            updateData.weightKg = weightKg;
        if (repsCompleted !== undefined)
            updateData.repsCompleted = repsCompleted;
        if (rpe !== undefined)
            updateData.rpe = rpe;
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
        return (0, response_1.successResponse)(res, entry, 'Set entry updated successfully');
    }
    catch (error) {
        console.error('Update set entry error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to update set entry', 500);
    }
};
exports.updateSetEntry = updateSetEntry;
const deleteSetEntry = async (req, res) => {
    try {
        const { gymId, userId } = req.user;
        const { workoutLogId, entryId } = req.params;
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
            return (0, response_1.errorResponse)(res, 'Workout log not found', 404);
        }
        if (workoutLog.endedAt) {
            return (0, response_1.errorResponse)(res, 'Cannot delete sets from a finished workout', 400);
        }
        const entry = await prisma.workoutLogEntry.findFirst({
            where: {
                id: entryId,
                workoutLogId,
                deletedAt: null,
            },
        });
        if (!entry) {
            return (0, response_1.errorResponse)(res, 'Set entry not found', 404);
        }
        await prisma.workoutLogEntry.update({
            where: { id: entryId },
            data: { deletedAt: new Date() },
        });
        return (0, response_1.successResponse)(res, null, 'Set entry deleted successfully');
    }
    catch (error) {
        console.error('Delete set entry error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to delete set entry', 500);
    }
};
exports.deleteSetEntry = deleteSetEntry;
const getWorkoutStats = async (req, res) => {
    try {
        const { gymId, userId } = req.user;
        const targetUserId = req.query.userId || userId;
        const targetUser = await prisma.user.findFirst({
            where: {
                id: targetUserId,
                gymId,
                deletedAt: null,
            },
        });
        if (!targetUser) {
            return (0, response_1.errorResponse)(res, 'User not found', 404);
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
        return (0, response_1.successResponse)(res, {
            totalWorkouts,
            completedWorkouts,
            activeWorkouts: totalWorkouts - completedWorkouts,
            totalSets,
            recentWorkouts,
        });
    }
    catch (error) {
        console.error('Get workout stats error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to retrieve workout statistics', 500);
    }
};
exports.getWorkoutStats = getWorkoutStats;
const getActiveWorkout = async (req, res) => {
    try {
        const { gymId, userId } = req.user;
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
            return (0, response_1.successResponse)(res, null, 'No active workout found');
        }
        return (0, response_1.successResponse)(res, activeWorkout);
    }
    catch (error) {
        console.error('Get active workout error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to retrieve active workout', 500);
    }
};
exports.getActiveWorkout = getActiveWorkout;
//# sourceMappingURL=workoutLog.controller.js.map