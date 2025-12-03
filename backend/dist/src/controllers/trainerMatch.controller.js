"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentTrainer = exports.getTrainerStudents = exports.endMatch = exports.updateMatchStatus = exports.createMatch = exports.getMatchById = exports.getMatches = void 0;
const client_1 = require("@prisma/client");
const response_js_1 = require("../utils/response.js");
const prisma = new client_1.PrismaClient();
const getMatches = async (req, res) => {
    try {
        const user = req.user;
        const { page = 1, limit = 20, status, trainerId, studentId } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {
            gymId: user.gymId,
            deletedAt: null
        };
        if (status) {
            where.status = status;
        }
        if (trainerId) {
            where.trainerId = trainerId;
        }
        if (studentId) {
            where.studentId = studentId;
        }
        const [matches, total] = await Promise.all([
            prisma.trainerMatch.findMany({
                where,
                skip,
                take: Number(limit),
                include: {
                    trainer: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            avatarUrl: true
                        }
                    },
                    student: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            avatarUrl: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.trainerMatch.count({ where })
        ]);
        return (0, response_js_1.successResponse)(res, {
            matches,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Error fetching matches:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to fetch trainer-student matches', 500);
    }
};
exports.getMatches = getMatches;
const getMatchById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const match = await prisma.trainerMatch.findFirst({
            where: {
                id,
                gymId: user.gymId,
                deletedAt: null
            },
            include: {
                trainer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        avatarUrl: true,
                        role: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        avatarUrl: true,
                        birthDate: true,
                        gender: true,
                        role: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });
        if (!match) {
            return (0, response_js_1.errorResponse)(res, 'Match not found', 404);
        }
        return (0, response_js_1.successResponse)(res, match);
    }
    catch (error) {
        console.error('Error fetching match:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to fetch match', 500);
    }
};
exports.getMatchById = getMatchById;
const createMatch = async (req, res) => {
    try {
        const { trainerId, studentId } = req.body;
        const user = req.user;
        const trainer = await prisma.user.findFirst({
            where: {
                id: trainerId,
                gymId: user.gymId,
                deletedAt: null
            },
            include: {
                role: {
                    select: { name: true }
                }
            }
        });
        if (!trainer) {
            return (0, response_js_1.errorResponse)(res, 'Trainer not found', 404);
        }
        if (trainer.role.name !== 'Trainer') {
            return (0, response_js_1.errorResponse)(res, 'User is not a trainer', 400);
        }
        const student = await prisma.user.findFirst({
            where: {
                id: studentId,
                gymId: user.gymId,
                deletedAt: null
            },
            include: {
                role: {
                    select: { name: true }
                }
            }
        });
        if (!student) {
            return (0, response_js_1.errorResponse)(res, 'Student not found', 404);
        }
        if (student.role.name !== 'Student') {
            return (0, response_js_1.errorResponse)(res, 'User is not a student', 400);
        }
        const existingMatch = await prisma.trainerMatch.findUnique({
            where: {
                trainerId_studentId: {
                    trainerId,
                    studentId
                }
            }
        });
        if (existingMatch && !existingMatch.deletedAt) {
            return (0, response_js_1.errorResponse)(res, 'This trainer-student match already exists', 409);
        }
        const match = existingMatch
            ? await prisma.trainerMatch.update({
                where: { id: existingMatch.id },
                data: {
                    status: 'active',
                    deletedAt: null
                },
                include: {
                    trainer: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    student: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                }
            })
            : await prisma.trainerMatch.create({
                data: {
                    gymId: user.gymId,
                    trainerId,
                    studentId,
                    status: 'active'
                },
                include: {
                    trainer: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    student: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                }
            });
        return (0, response_js_1.successResponse)(res, match, 'Trainer-student match created successfully', 201);
    }
    catch (error) {
        console.error('Error creating match:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to create match', 500);
    }
};
exports.createMatch = createMatch;
const updateMatchStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const user = req.user;
        const match = await prisma.trainerMatch.findFirst({
            where: {
                id,
                gymId: user.gymId,
                deletedAt: null
            }
        });
        if (!match) {
            return (0, response_js_1.errorResponse)(res, 'Match not found', 404);
        }
        const updatedMatch = await prisma.trainerMatch.update({
            where: { id },
            data: { status },
            include: {
                trainer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
        return (0, response_js_1.successResponse)(res, updatedMatch, 'Match status updated successfully');
    }
    catch (error) {
        console.error('Error updating match status:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to update match status', 500);
    }
};
exports.updateMatchStatus = updateMatchStatus;
const endMatch = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const match = await prisma.trainerMatch.findFirst({
            where: {
                id,
                gymId: user.gymId,
                deletedAt: null
            }
        });
        if (!match) {
            return (0, response_js_1.errorResponse)(res, 'Match not found', 404);
        }
        await prisma.trainerMatch.update({
            where: { id },
            data: {
                status: 'ended',
                deletedAt: new Date()
            }
        });
        return (0, response_js_1.successResponse)(res, null, 'Trainer-student match ended successfully');
    }
    catch (error) {
        console.error('Error ending match:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to end match', 500);
    }
};
exports.endMatch = endMatch;
const getTrainerStudents = async (req, res) => {
    try {
        const { trainerId } = req.params;
        const user = req.user;
        const { status = 'active' } = req.query;
        const trainer = await prisma.user.findFirst({
            where: {
                id: trainerId,
                gymId: user.gymId,
                deletedAt: null
            }
        });
        if (!trainer) {
            return (0, response_js_1.errorResponse)(res, 'Trainer not found', 404);
        }
        const matches = await prisma.trainerMatch.findMany({
            where: {
                trainerId,
                gymId: user.gymId,
                status: String(status),
                deletedAt: null
            },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        avatarUrl: true,
                        birthDate: true,
                        gender: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        const students = matches.map(match => ({
            matchId: match.id,
            matchStatus: match.status,
            matchCreatedAt: match.createdAt,
            ...match.student
        }));
        return (0, response_js_1.successResponse)(res, {
            trainerId,
            status,
            totalStudents: students.length,
            students
        });
    }
    catch (error) {
        console.error('Error fetching trainer students:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to fetch trainer students', 500);
    }
};
exports.getTrainerStudents = getTrainerStudents;
const getStudentTrainer = async (req, res) => {
    try {
        const { studentId } = req.params;
        const user = req.user;
        const student = await prisma.user.findFirst({
            where: {
                id: studentId,
                gymId: user.gymId,
                deletedAt: null
            }
        });
        if (!student) {
            return (0, response_js_1.errorResponse)(res, 'Student not found', 404);
        }
        const match = await prisma.trainerMatch.findFirst({
            where: {
                studentId,
                gymId: user.gymId,
                status: 'active',
                deletedAt: null
            },
            include: {
                trainer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        if (!match) {
            return (0, response_js_1.successResponse)(res, {
                studentId,
                hasTrainer: false,
                trainer: null
            });
        }
        return (0, response_js_1.successResponse)(res, {
            studentId,
            hasTrainer: true,
            matchId: match.id,
            matchStatus: match.status,
            matchCreatedAt: match.createdAt,
            trainer: match.trainer
        });
    }
    catch (error) {
        console.error('Error fetching student trainer:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to fetch student trainer', 500);
    }
};
exports.getStudentTrainer = getStudentTrainer;
//# sourceMappingURL=trainerMatch.controller.js.map