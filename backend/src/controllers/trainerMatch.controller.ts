import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '../utils/response.js';

const prisma = new PrismaClient();

/**
 * Get all trainer-student matches for the gym
 * GET /api/trainer-matches
 */
export const getMatches = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { page = 1, limit = 20, status, trainerId, studentId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
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

    return successResponse(res, {
      items: matches,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return errorResponse(res, 'Failed to fetch trainer-student matches', 500);
  }
};

/**
 * Get match by ID
 * GET /api/trainer-matches/:id
 */
export const getMatchById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

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
      return errorResponse(res, 'Match not found', 404);
    }

    return successResponse(res, match);
  } catch (error) {
    console.error('Error fetching match:', error);
    return errorResponse(res, 'Failed to fetch match', 500);
  }
};

/**
 * Create trainer-student match
 * POST /api/trainer-matches
 */
export const createMatch = async (req: Request, res: Response) => {
  try {
    const { trainerId, studentId } = req.body;
    const user = (req as any).user;

    console.log('Creating trainer match:', { trainerId, studentId, gymId: user.gymId });

    // Verify trainer exists and belongs to gym
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
      return errorResponse(res, 'Trainer not found', 404);
    }

    if (trainer.role.name !== 'Trainer') {
      return errorResponse(res, 'User is not a trainer', 400);
    }

    // Verify student exists and belongs to gym
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
      return errorResponse(res, 'Student not found', 404);
    }

    if (student.role.name !== 'Student') {
      return errorResponse(res, 'User is not a student', 400);
    }

    // Check if match already exists
    const existingMatch = await prisma.trainerMatch.findUnique({
      where: {
        trainerId_studentId: {
          trainerId,
          studentId
        }
      }
    });

    if (existingMatch && !existingMatch.deletedAt) {
      return errorResponse(res, 'This trainer-student match already exists', 409);
    }

    // Create or restore match
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

    return successResponse(res, match, 'Trainer-student match created successfully', 201);
  } catch (error) {
    console.error('Error creating match:', error);
    return errorResponse(res, 'Failed to create match', 500);
  }
};

/**
 * Update match status
 * PATCH /api/trainer-matches/:id/status
 */
export const updateMatchStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = (req as any).user;

    const match = await prisma.trainerMatch.findFirst({
      where: {
        id,
        gymId: user.gymId,
        deletedAt: null
      }
    });

    if (!match) {
      return errorResponse(res, 'Match not found', 404);
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

    return successResponse(res, updatedMatch, 'Match status updated successfully');
  } catch (error) {
    console.error('Error updating match status:', error);
    return errorResponse(res, 'Failed to update match status', 500);
  }
};

/**
 * End trainer-student match (soft delete)
 * DELETE /api/trainer-matches/:id
 */
export const endMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const match = await prisma.trainerMatch.findFirst({
      where: {
        id,
        gymId: user.gymId,
        deletedAt: null
      }
    });

    if (!match) {
      return errorResponse(res, 'Match not found', 404);
    }

    await prisma.trainerMatch.update({
      where: { id },
      data: {
        status: 'ended',
        deletedAt: new Date()
      }
    });

    return successResponse(res, null, 'Trainer-student match ended successfully');
  } catch (error) {
    console.error('Error ending match:', error);
    return errorResponse(res, 'Failed to end match', 500);
  }
};

/**
 * Get trainer's students
 * GET /api/trainer-matches/trainer/:trainerId/students
 */
export const getTrainerStudents = async (req: Request, res: Response) => {
  try {
    const { trainerId } = req.params;
    const user = (req as any).user;
    const { status = 'active' } = req.query;

    // Verify trainer exists and belongs to gym
    const trainer = await prisma.user.findFirst({
      where: {
        id: trainerId,
        gymId: user.gymId,
        deletedAt: null
      }
    });

    if (!trainer) {
      return errorResponse(res, 'Trainer not found', 404);
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

    return successResponse(res, {
      trainerId,
      status,
      totalStudents: students.length,
      students
    });
  } catch (error) {
    console.error('Error fetching trainer students:', error);
    return errorResponse(res, 'Failed to fetch trainer students', 500);
  }
};

/**
 * Get student's trainer
 * GET /api/trainer-matches/student/:studentId/trainer
 */
export const getStudentTrainer = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const user = (req as any).user;

    // Verify student exists and belongs to gym
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        gymId: user.gymId,
        deletedAt: null
      }
    });

    if (!student) {
      return errorResponse(res, 'Student not found', 404);
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
      return successResponse(res, {
        studentId,
        hasTrainer: false,
        trainer: null
      });
    }

    return successResponse(res, {
      studentId,
      hasTrainer: true,
      matchId: match.id,
      matchStatus: match.status,
      matchCreatedAt: match.createdAt,
      trainer: match.trainer
    });
  } catch (error) {
    console.error('Error fetching student trainer:', error);
    return errorResponse(res, 'Failed to fetch student trainer', 500);
  }
};

/**
 * Get trainer's students with detailed statistics (for My Students page)
 * GET /api/trainer-matches/my-students
 */
export const getMyStudentsDetailed = async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;

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
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
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

    // Calculate statistics for each student
    const studentsWithStats = matches.map(match => {
      const student = match.student;
      const lastWorkout = student.workoutLogs[0];
      const lastWorkoutDate = lastWorkout?.startedAt;
      const monthlyWorkouts = student.workoutLogs.length;

      // Consider active if worked out in last 7 days
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

    // Calculate overall stats
    const totalStudents = studentsWithStats.length;
    const activeStudents = studentsWithStats.filter(s => s.isActive).length;
    const totalWorkouts = studentsWithStats.reduce((sum, s) => sum + s.monthlyWorkouts, 0);
    const avgWorkoutsPerWeek = totalStudents > 0
      ? (totalWorkouts / totalStudents) * (7 / 30)
      : 0;

    return successResponse(res, {
      items: studentsWithStats,
      stats: {
        total: totalStudents,
        active: activeStudents,
        avgWorkoutsPerWeek: parseFloat(avgWorkoutsPerWeek.toFixed(1)),
      },
    });
  } catch (error) {
    console.error('Error fetching my students:', error);
    return errorResponse(res, 'Failed to fetch students', 500);
  }
};

/**
 * Get detailed student info for trainer (for student detail page)
 * GET /api/trainer-matches/my-students/:studentId
 */
export const getMyStudentDetail = async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { studentId } = req.params;

    // Verify trainer-student relationship
    const match = await prisma.trainerMatch.findFirst({
      where: {
        trainerId: userId,
        studentId,
        status: 'active',
        deletedAt: null,
      },
    });

    if (!match) {
      return errorResponse(res, 'Student not found or not assigned to you', 404);
    }

    // Get detailed student information
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
      return errorResponse(res, 'Student not found', 404);
    }

    return successResponse(res, {
      ...student,
      matchedAt: match.createdAt,
    });
  } catch (error) {
    console.error('Error fetching student detail:', error);
    return errorResponse(res, 'Failed to fetch student details', 500);
  }
};
