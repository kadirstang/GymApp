import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '../utils/response.js';

const prisma = new PrismaClient();

/**
 * Get all gyms (SuperAdmin only)
 * GET /api/gyms
 */
export const getGyms = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build filter
    const where: any = {
      deletedAt: null
    };

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { slug: { contains: String(search), mode: 'insensitive' } },
        { address: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [gyms, total] = await Promise.all([
      prisma.gym.findMany({
        where,
        skip,
        take: Number(limit),
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          contactPhone: true,
          logoUrl: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              users: { where: { deletedAt: null } },
              workoutPrograms: { where: { deletedAt: null } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.gym.count({ where })
    ]);

    return successResponse(res, {
      items: gyms,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching gyms:', error);
    return errorResponse(res, 'Failed to fetch gyms', 500);
  }
};

/**
 * Get gym by ID
 * GET /api/gyms/:id
 */
export const getGymById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // SuperAdmin can view any gym, others can only view their own
    const where: any = {
      id,
      deletedAt: null
    };

    if (user.role !== 'SuperAdmin') {
      where.id = user.gymId;
    }

    const gym = await prisma.gym.findFirst({
      where,
      include: {
        _count: {
          select: {
            users: { where: { deletedAt: null } },
            workoutPrograms: { where: { deletedAt: null } },
            exercises: { where: { deletedAt: null } },
            equipments: { where: { deletedAt: null } },
            products: { where: { deletedAt: null } }
          }
        }
      }
    });

    if (!gym) {
      return errorResponse(res, 'Gym not found', 404);
    }

    return successResponse(res, gym);
  } catch (error) {
    console.error('Error fetching gym:', error);
    return errorResponse(res, 'Failed to fetch gym', 500);
  }
};

/**
 * Create new gym (SuperAdmin only)
 * POST /api/gyms
 */
export const createGym = async (req: Request, res: Response) => {
  try {
    const { name, slug, address, contactPhone, logoUrl } = req.body;

    // Check if slug already exists
    const existingGym = await prisma.gym.findUnique({
      where: { slug }
    });

    if (existingGym) {
      return errorResponse(res, 'Gym with this slug already exists', 409);
    }

    const gym = await prisma.gym.create({
      data: {
        name,
        slug,
        address,
        contactPhone,
        logoUrl,
        isActive: true
      }
    });

    // Create default roles for the new gym
    const defaultRoles = [
      {
        name: 'GymOwner',
        permissions: {
          'users.read': true,
          'users.create': true,
          'users.update': true,
          'users.delete': true,
          'roles.read': true,
          'roles.create': true,
          'roles.update': true,
          'roles.delete': true,
          'programs.read': true,
          'programs.create': true,
          'programs.update': true,
          'programs.delete': true,
          'exercises.read': true,
          'exercises.create': true,
          'exercises.update': true,
          'exercises.delete': true,
          'equipments.read': true,
          'equipments.create': true,
          'equipments.update': true,
          'equipments.delete': true,
          'products.read': true,
          'products.create': true,
          'products.update': true,
          'products.delete': true,
          'orders.read': true,
          'orders.update': true
        }
      },
      {
        name: 'Trainer',
        permissions: {
          'users.read': true,
          'students.read': true,
          'students.update': true,
          'programs.read': true,
          'programs.create': true,
          'programs.update': true,
          'programs.delete': true,
          'exercises.read': true,
          'equipments.read': true
        }
      },
      {
        name: 'Student',
        permissions: {
          'workouts.read': true,
          'workouts.create': true,
          'products.read': true,
          'orders.create': true
        }
      }
    ];

    await prisma.role.createMany({
      data: defaultRoles.map(role => ({
        gymId: gym.id,
        name: role.name,
        permissions: role.permissions
      }))
    });

    return successResponse(res, gym, 'Gym created successfully', 201);
  } catch (error) {
    console.error('Error creating gym:', error);
    return errorResponse(res, 'Failed to create gym', 500);
  }
};

/**
 * Update gym
 * PUT /api/gyms/:id
 */
export const updateGym = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, address, contactPhone, contactEmail, website, logoUrl } = req.body;
    const user = (req as any).user;

    // SuperAdmin can update any gym, GymOwner can only update their own
    const where: any = {
      id,
      deletedAt: null
    };

    if (user.role !== 'SuperAdmin') {
      where.id = user.gymId;
    }

    // Check if gym exists
    const gym = await prisma.gym.findFirst({ where });
    if (!gym) {
      return errorResponse(res, 'Gym not found', 404);
    }

    // If slug is being changed, check for uniqueness
    if (slug && slug !== gym.slug) {
      const existingGym = await prisma.gym.findUnique({
        where: { slug }
      });
      if (existingGym) {
        return errorResponse(res, 'Gym with this slug already exists', 409);
      }
    }

    const updatedGym = await prisma.gym.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(address !== undefined && { address }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(website !== undefined && { website }),
        ...(logoUrl !== undefined && { logoUrl })
      }
    });

    return successResponse(res, updatedGym, 'Gym updated successfully');
  } catch (error) {
    console.error('Error updating gym:', error);
    return errorResponse(res, 'Failed to update gym', 500);
  }
};

/**
 * Toggle gym activation status (SuperAdmin only)
 * PATCH /api/gyms/:id/toggle-active
 */
export const toggleGymActive = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const gym = await prisma.gym.findFirst({
      where: { id, deletedAt: null }
    });

    if (!gym) {
      return errorResponse(res, 'Gym not found', 404);
    }

    const updatedGym = await prisma.gym.update({
      where: { id },
      data: {
        isActive: !gym.isActive
      }
    });

    return successResponse(
      res,
      updatedGym,
      `Gym ${updatedGym.isActive ? 'activated' : 'deactivated'} successfully`
    );
  } catch (error) {
    console.error('Error toggling gym status:', error);
    return errorResponse(res, 'Failed to toggle gym status', 500);
  }
};

/**
 * Soft delete gym (SuperAdmin only)
 * DELETE /api/gyms/:id
 */
export const deleteGym = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const gym = await prisma.gym.findFirst({
      where: { id, deletedAt: null }
    });

    if (!gym) {
      return errorResponse(res, 'Gym not found', 404);
    }

    // Soft delete
    await prisma.gym.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    });

    return successResponse(res, null, 'Gym deleted successfully');
  } catch (error) {
    console.error('Error deleting gym:', error);
    return errorResponse(res, 'Failed to delete gym', 500);
  }
};

/**
 * Get gym statistics
 * GET /api/gyms/:id/stats
 */
export const getGymStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Verify access
    if (user.role !== 'SuperAdmin' && user.gymId !== id) {
      return errorResponse(res, 'Unauthorized', 403);
    }

    const gym = await prisma.gym.findFirst({
      where: { id, deletedAt: null }
    });

    if (!gym) {
      return errorResponse(res, 'Gym not found', 404);
    }

    // Get statistics
    const [
      totalUsers,
      activeUsers,
      totalPrograms,
      totalExercises,
      totalEquipments,
      totalProducts,
      totalOrders,
      recentOrders
    ] = await Promise.all([
      prisma.user.count({
        where: { gymId: id, deletedAt: null }
      }),
      prisma.user.count({
        where: {
          gymId: id,
          deletedAt: null,
          workoutLogs: {
            some: {
              startedAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
              }
            }
          }
        }
      }),
      prisma.workoutProgram.count({
        where: { gymId: id, deletedAt: null }
      }),
      prisma.exercise.count({
        where: { gymId: id, deletedAt: null }
      }),
      prisma.equipment.count({
        where: { gymId: id, deletedAt: null }
      }),
      prisma.product.count({
        where: { gymId: id, deletedAt: null }
      }),
      prisma.order.count({
        where: { gymId: id, deletedAt: null }
      }),
      prisma.order.findMany({
        where: { gymId: id, deletedAt: null },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      })
    ]);

    return successResponse(res, {
      gym: {
        id: gym.id,
        name: gym.name,
        slug: gym.slug,
        isActive: gym.isActive
      },
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers
        },
        programs: totalPrograms,
        exercises: totalExercises,
        equipments: totalEquipments,
        products: totalProducts,
        orders: {
          total: totalOrders,
          recent: recentOrders
        }
      }
    });
  } catch (error) {
    console.error('Error fetching gym stats:', error);
    return errorResponse(res, 'Failed to fetch gym statistics', 500);
  }
};
