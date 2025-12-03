"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProgramStats = exports.cloneProgram = exports.deleteProgram = exports.updateProgram = exports.createProgram = exports.getProgramById = exports.getPrograms = void 0;
const client_1 = require("@prisma/client");
const response_js_1 = require("../utils/response.js");
const prisma = new client_1.PrismaClient();
const getPrograms = async (req, res) => {
    try {
        const { gymId } = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const search = req.query.search;
        const difficultyLevel = req.query.difficultyLevel;
        const assignedUserId = req.query.assignedUserId;
        const creatorId = req.query.creatorId;
        const where = {
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
        return (0, response_js_1.successResponse)(res, {
            programs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error('Get programs error:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to retrieve programs', 500);
    }
};
exports.getPrograms = getPrograms;
const getProgramById = async (req, res) => {
    try {
        const { gymId } = req.user;
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
            return (0, response_js_1.errorResponse)(res, 'Program not found', 404);
        }
        return (0, response_js_1.successResponse)(res, program);
    }
    catch (error) {
        console.error('Get program by ID error:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to retrieve program', 500);
    }
};
exports.getProgramById = getProgramById;
const createProgram = async (req, res) => {
    try {
        const { gymId, userId } = req.user;
        const { name, description, difficultyLevel, assignedUserId } = req.body;
        if (assignedUserId) {
            const assignedUser = await prisma.user.findFirst({
                where: {
                    id: assignedUserId,
                    gymId,
                    deletedAt: null,
                },
            });
            if (!assignedUser) {
                return (0, response_js_1.errorResponse)(res, 'Assigned user not found in your gym', 404);
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
        return (0, response_js_1.successResponse)(res, program, 'Program created successfully', 201);
    }
    catch (error) {
        console.error('Create program error:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to create program', 500);
    }
};
exports.createProgram = createProgram;
const updateProgram = async (req, res) => {
    try {
        const { gymId } = req.user;
        const { id } = req.params;
        const { name, description, difficultyLevel, assignedUserId } = req.body;
        const existingProgram = await prisma.workoutProgram.findFirst({
            where: {
                id,
                gymId,
                deletedAt: null,
            },
        });
        if (!existingProgram) {
            return (0, response_js_1.errorResponse)(res, 'Program not found', 404);
        }
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
                    return (0, response_js_1.errorResponse)(res, 'Assigned user not found in your gym', 404);
                }
            }
        }
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (description !== undefined)
            updateData.description = description;
        if (difficultyLevel !== undefined)
            updateData.difficultyLevel = difficultyLevel;
        if (assignedUserId !== undefined)
            updateData.assignedUserId = assignedUserId;
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
        return (0, response_js_1.successResponse)(res, program, 'Program updated successfully');
    }
    catch (error) {
        console.error('Update program error:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to update program', 500);
    }
};
exports.updateProgram = updateProgram;
const deleteProgram = async (req, res) => {
    try {
        const { gymId } = req.user;
        const { id } = req.params;
        const program = await prisma.workoutProgram.findFirst({
            where: {
                id,
                gymId,
                deletedAt: null,
            },
        });
        if (!program) {
            return (0, response_js_1.errorResponse)(res, 'Program not found', 404);
        }
        await prisma.workoutProgram.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return (0, response_js_1.successResponse)(res, null, 'Program deleted successfully');
    }
    catch (error) {
        console.error('Delete program error:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to delete program', 500);
    }
};
exports.deleteProgram = deleteProgram;
const cloneProgram = async (req, res) => {
    try {
        const { gymId, userId } = req.user;
        const { id } = req.params;
        const { name, assignedUserId } = req.body;
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
            return (0, response_js_1.errorResponse)(res, 'Source program not found', 404);
        }
        if (assignedUserId) {
            const assignedUser = await prisma.user.findFirst({
                where: {
                    id: assignedUserId,
                    gymId,
                    deletedAt: null,
                },
            });
            if (!assignedUser) {
                return (0, response_js_1.errorResponse)(res, 'Assigned user not found in your gym', 404);
            }
        }
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
        return (0, response_js_1.successResponse)(res, newProgram, 'Program cloned successfully', 201);
    }
    catch (error) {
        console.error('Clone program error:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to clone program', 500);
    }
};
exports.cloneProgram = cloneProgram;
const getProgramStats = async (req, res) => {
    try {
        const { gymId } = req.user;
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
        const difficultyStats = byDifficulty.reduce((acc, item) => {
            acc[item.difficultyLevel] = item._count;
            return acc;
        }, {});
        return (0, response_js_1.successResponse)(res, {
            totalPrograms: total,
            assignedPrograms: assigned,
            unassignedPrograms: unassigned,
            byDifficulty: difficultyStats,
        });
    }
    catch (error) {
        console.error('Get program stats error:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to retrieve program statistics', 500);
    }
};
exports.getProgramStats = getProgramStats;
//# sourceMappingURL=program.controller.js.map