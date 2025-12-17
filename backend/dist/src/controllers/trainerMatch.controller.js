"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyStudentDetail = exports.getMyStudentsDetailed = exports.getStudentTrainer = exports.getTrainerStudents = exports.endMatch = exports.updateMatchStatus = exports.createMatch = exports.getMatchById = exports.getMatches = void 0;
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
            items: matches,
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
        console.log('Creating trainer match:', { trainerId, studentId, gymId: user.gymId });
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
        console.log('Trainer found:', trainer ? { id: trainer.id, role: trainer.role.name } : 'NOT FOUND');
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
        console.log('Student found:', student ? { id: student.id, role: student.role.name } : 'NOT FOUND');
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
const getMyStudentsDetailed = async (req, res) => {
    try {
        const { userId } = req.user;
        console.log('Fetching students for trainer:', userId);
        const matches = await prisma.trainerMatch.findMany({
            where: {
                trainerId: userId,
                status: 'active',
                deletedAt: null,
            },
            include: {
                student: {
                    include: {
                        assignedPrograms: {
                            where: { deletedAt: null },
                            select: {
                                id: true,
                                name: true,
                                difficultyLevel: true,
                            },
                            take: 1,
                        },
                        workoutLogs: {
                            where: {
                                deletedAt: null,
                                startedAt: {
                                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                                },
                            },
                            select: {
                                id: true,
                                startedAt: true,
                                endedAt: true,
                            },
                            orderBy: { startedAt: 'desc' },
                        },
                        measurements: {
                            where: { deletedAt: null },
                            orderBy: { measuredAt: 'desc' },
                            take: 1,
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        console.log('Found matches:', matches.length);
        const studentsWithStats = matches.map(match => {
            const student = match.student;
            const lastWorkout = student.workoutLogs[0];
            const lastWorkoutDate = lastWorkout?.startedAt;
            const monthlyWorkouts = student.workoutLogs.length;
            const isActive = lastWorkoutDate &&
                (Date.now() - new Date(lastWorkoutDate).getTime()) < 7 * 24 * 60 * 60 * 1000;
            return {
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                email: student.email,
                phone: student.phone,
                avatarUrl: student.avatarUrl,
                lastWorkoutDate,
                assignedProgram: student.assignedPrograms[0] || null,
                monthlyWorkouts,
                isActive: !!isActive,
                latestMeasurement: student.measurements[0] || null,
                matchedAt: match.createdAt,
            };
        });
        const totalStudents = studentsWithStats.length;
        const activeStudents = studentsWithStats.filter(s => s.isActive).length;
        const totalWorkouts = studentsWithStats.reduce((sum, s) => sum + s.monthlyWorkouts, 0);
        const avgWorkoutsPerWeek = totalStudents > 0
            ? (totalWorkouts / totalStudents) * (7 / 30)
            : 0;
        return (0, response_js_1.successResponse)(res, {
            items: studentsWithStats,
            stats: {
                total: totalStudents,
                active: activeStudents,
                avgWorkoutsPerWeek: parseFloat(avgWorkoutsPerWeek.toFixed(1)),
            },
        });
    }
    catch (error) {
        console.error('Error fetching my students:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to fetch students', 500);
    }
};
exports.getMyStudentsDetailed = getMyStudentsDetailed;
const getMyStudentDetail = async (req, res) => {
    try {
        const { userId } = req.user;
        const { studentId } = req.params;
        const match = await prisma.trainerMatch.findFirst({
            where: {
                trainerId: userId,
                studentId,
                status: 'active',
                deletedAt: null,
            },
        });
        if (!match) {
            return (0, response_js_1.errorResponse)(res, 'Student not found or not assigned to you', 404);
        }
        const student = await prisma.user.findFirst({
            where: {
                id: studentId,
                deletedAt: null,
            },
            include: {
                role: {
                    select: { name: true },
                },
                assignedPrograms: {
                    where: { deletedAt: null },
                    include: {
                        creator: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                workoutLogs: {
                    where: { deletedAt: null },
                    orderBy: { startedAt: 'desc' },
                    take: 30,
                    include: {
                        program: {
                            select: {
                                name: true,
                            },
                        },
                        _count: {
                            select: { entries: true },
                        },
                    },
                },
                measurements: {
                    where: { deletedAt: null },
                    orderBy: { measuredAt: 'desc' },
                    take: 10,
                },
                orders: {
                    where: { deletedAt: null },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    select: {
                        id: true,
                        orderNumber: true,
                        totalAmount: true,
                        status: true,
                        createdAt: true,
                        items: {
                            include: {
                                product: {
                                    select: {
                                        name: true,
                                        imageUrl: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!student) {
            return (0, response_js_1.errorResponse)(res, 'Student not found', 404);
        }
        return (0, response_js_1.successResponse)(res, {
            ...student,
            matchedAt: match.createdAt,
        });
    }
    catch (error) {
        console.error('Error fetching student detail:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to fetch student details', 500);
    }
};
exports.getMyStudentDetail = getMyStudentDetail;
//# sourceMappingURL=trainerMatch.controller.js.map