"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadExerciseVideo = exports.getExerciseStats = exports.getMuscleGroups = exports.deleteExercise = exports.updateExercise = exports.createExercise = exports.getExerciseById = exports.getExercises = void 0;
const client_1 = require("@prisma/client");
const response_js_1 = require("../utils/response.js");
const upload_middleware_1 = require("../middleware/upload.middleware");
const prisma = new client_1.PrismaClient();
const getExercises = async (req, res) => {
    try {
        const { gymId } = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search;
        const targetMuscleGroup = req.query.targetMuscleGroup;
        const equipmentNeededId = req.query.equipmentNeededId;
        const skip = (page - 1) * limit;
        const where = {
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
        return (0, response_js_1.successResponse)(res, {
            items: exercises,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Get exercises error:', error);
        return (0, response_js_1.errorResponse)(res, error.message, 500);
    }
};
exports.getExercises = getExercises;
const getExerciseById = async (req, res) => {
    try {
        const { gymId } = req.user;
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
            return (0, response_js_1.errorResponse)(res, 'Exercise not found', 404);
        }
        return (0, response_js_1.successResponse)(res, exercise);
    }
    catch (error) {
        console.error('Get exercise error:', error);
        return (0, response_js_1.errorResponse)(res, error.message, 500);
    }
};
exports.getExerciseById = getExerciseById;
const createExercise = async (req, res) => {
    try {
        const { gymId, userId } = req.user;
        const { name, description, videoUrl, targetMuscleGroup, equipmentNeededId } = req.body;
        if (equipmentNeededId) {
            const equipment = await prisma.equipment.findFirst({
                where: {
                    id: equipmentNeededId,
                    gymId,
                    deletedAt: null
                }
            });
            if (!equipment) {
                return (0, response_js_1.errorResponse)(res, 'Equipment not found or does not belong to your gym', 404);
            }
        }
        const existingExercise = await prisma.exercise.findFirst({
            where: {
                gymId,
                name: { equals: name, mode: 'insensitive' },
                deletedAt: null
            }
        });
        if (existingExercise) {
            return (0, response_js_1.errorResponse)(res, 'Exercise with this name already exists in your gym', 409);
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
        return (0, response_js_1.successResponse)(res, exercise, 'Exercise created successfully', 201);
    }
    catch (error) {
        console.error('Create exercise error:', error);
        return (0, response_js_1.errorResponse)(res, error.message, 500);
    }
};
exports.createExercise = createExercise;
const updateExercise = async (req, res) => {
    try {
        const { gymId, userId, role } = req.user;
        const { id } = req.params;
        const { name, description, videoUrl, targetMuscleGroup, equipmentNeededId } = req.body;
        const existingExercise = await prisma.exercise.findFirst({
            where: {
                id,
                gymId,
                deletedAt: null
            }
        });
        if (!existingExercise) {
            return (0, response_js_1.errorResponse)(res, 'Exercise not found', 404);
        }
        if (role.name === 'Trainer' && existingExercise.createdBy !== userId) {
            return (0, response_js_1.errorResponse)(res, 'You can only edit exercises created by you', 403);
        }
        if (equipmentNeededId) {
            const equipment = await prisma.equipment.findFirst({
                where: {
                    id: equipmentNeededId,
                    gymId,
                    deletedAt: null
                }
            });
            if (!equipment) {
                return (0, response_js_1.errorResponse)(res, 'Equipment not found or does not belong to your gym', 404);
            }
        }
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
                return (0, response_js_1.errorResponse)(res, 'Exercise with this name already exists in your gym', 409);
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
        return (0, response_js_1.successResponse)(res, exercise, 'Exercise updated successfully');
    }
    catch (error) {
        console.error('Update exercise error:', error);
        return (0, response_js_1.errorResponse)(res, error.message, 500);
    }
};
exports.updateExercise = updateExercise;
const deleteExercise = async (req, res) => {
    try {
        const { gymId, userId, role } = req.user;
        const { id } = req.params;
        const exercise = await prisma.exercise.findFirst({
            where: {
                id,
                gymId,
                deletedAt: null
            }
        });
        if (!exercise) {
            return (0, response_js_1.errorResponse)(res, 'Exercise not found', 404);
        }
        if (role.name === 'Trainer' && exercise.createdBy !== userId) {
            return (0, response_js_1.errorResponse)(res, 'You can only delete exercises created by you', 403);
        }
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
            return (0, response_js_1.errorResponse)(res, `Cannot delete exercise. It is used in ${activeProgramExercises} active workout program(s)`, 400);
        }
        await prisma.exercise.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
        return (0, response_js_1.successResponse)(res, null, 'Exercise deleted successfully');
    }
    catch (error) {
        console.error('Delete exercise error:', error);
        return (0, response_js_1.errorResponse)(res, error.message, 500);
    }
};
exports.deleteExercise = deleteExercise;
const getMuscleGroups = async (req, res) => {
    try {
        const { gymId } = req.user;
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
            .filter((value) => value !== null)
            .sort();
        return (0, response_js_1.successResponse)(res, {
            muscleGroups,
            total: muscleGroups.length
        });
    }
    catch (error) {
        console.error('Get muscle groups error:', error);
        return (0, response_js_1.errorResponse)(res, error.message, 500);
    }
};
exports.getMuscleGroups = getMuscleGroups;
const getExerciseStats = async (req, res) => {
    try {
        const { gymId } = req.user;
        const [totalExercises, exercisesWithVideo, exercisesWithEquipment, muscleGroupCount] = await Promise.all([
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
        return (0, response_js_1.successResponse)(res, {
            totalExercises,
            exercisesWithVideo,
            exercisesWithEquipment,
            uniqueMuscleGroups: muscleGroupCount.length
        });
    }
    catch (error) {
        console.error('Get exercise stats error:', error);
        return (0, response_js_1.errorResponse)(res, error.message, 500);
    }
};
exports.getExerciseStats = getExerciseStats;
const uploadExerciseVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const { gymId } = req.user;
        if (!req.file) {
            return (0, response_js_1.errorResponse)(res, 'No file uploaded', 400);
        }
        const exercise = await prisma.exercise.findFirst({
            where: { id, gymId, deletedAt: null }
        });
        if (!exercise) {
            return (0, response_js_1.errorResponse)(res, 'Exercise not found', 404);
        }
        if (exercise.videoUrl) {
            (0, upload_middleware_1.deleteExerciseVideo)(exercise.videoUrl);
        }
        const videoUrl = `/uploads/exercise-videos/${req.file.filename}`;
        const updatedExercise = await prisma.exercise.update({
            where: { id },
            data: { videoUrl },
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
        return (0, response_js_1.successResponse)(res, updatedExercise, 'Exercise video uploaded successfully');
    }
    catch (error) {
        if (req.file) {
            (0, upload_middleware_1.deleteExerciseVideo)(`/uploads/exercise-videos/${req.file.filename}`);
        }
        console.error('Upload exercise video error:', error);
        return (0, response_js_1.errorResponse)(res, error.message, 500);
    }
};
exports.uploadExerciseVideo = uploadExerciseVideo;
//# sourceMappingURL=exercise.controller.js.map