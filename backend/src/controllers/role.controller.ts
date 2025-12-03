import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '../utils/response.js';

const prisma = new PrismaClient();

/**
 * Get all roles for a gym
 * GET /api/roles
 */
export const getRoles = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      gymId: user.gymId,
      deletedAt: null
    };

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        skip,
        take: Number(limit),
        select: {
          id: true,
          name: true,
          permissions: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              users: { where: { deletedAt: null } }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.role.count({ where })
    ]);

    return successResponse(res, {
      roles,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return errorResponse(res, 'Failed to fetch roles', 500);
  }
};

/**
 * Get role by ID
 * GET /api/roles/:id
 */
export const getRoleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const role = await prisma.role.findFirst({
      where: {
        id,
        gymId: user.gymId,
        deletedAt: null
      },
      include: {
        _count: {
          select: {
            users: { where: { deletedAt: null } }
          }
        }
      }
    });

    if (!role) {
      return errorResponse(res, 'Role not found', 404);
    }

    return successResponse(res, role);
  } catch (error) {
    console.error('Error fetching role:', error);
    return errorResponse(res, 'Failed to fetch role', 500);
  }
};

/**
 * Create new role
 * POST /api/roles
 */
export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, permissions } = req.body;
    const user = (req as any).user;

    // Check if role with same name exists in this gym
    const existingRole = await prisma.role.findUnique({
      where: {
        gymId_name: {
          gymId: user.gymId,
          name
        }
      }
    });

    if (existingRole) {
      return errorResponse(res, 'Role with this name already exists in your gym', 409);
    }

    const role = await prisma.role.create({
      data: {
        gymId: user.gymId,
        name,
        permissions: permissions || {}
      }
    });

    return successResponse(res, role, 'Role created successfully', 201);
  } catch (error) {
    console.error('Error creating role:', error);
    return errorResponse(res, 'Failed to create role', 500);
  }
};

/**
 * Update role
 * PUT /api/roles/:id
 */
export const updateRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, permissions } = req.body;
    const user = (req as any).user;

    // Check if role exists and belongs to user's gym
    const role = await prisma.role.findFirst({
      where: {
        id,
        gymId: user.gymId,
        deletedAt: null
      }
    });

    if (!role) {
      return errorResponse(res, 'Role not found', 404);
    }

    // Prevent modifying default system roles
    const systemRoles = ['SuperAdmin', 'GymOwner', 'Trainer', 'Student'];
    if (systemRoles.includes(role.name) && name && name !== role.name) {
      return errorResponse(res, 'Cannot rename system roles', 400);
    }

    // If name is being changed, check uniqueness
    if (name && name !== role.name) {
      const existingRole = await prisma.role.findUnique({
        where: {
          gymId_name: {
            gymId: user.gymId,
            name
          }
        }
      });

      if (existingRole) {
        return errorResponse(res, 'Role with this name already exists', 409);
      }
    }

    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(permissions && { permissions })
      }
    });

    return successResponse(res, updatedRole, 'Role updated successfully');
  } catch (error) {
    console.error('Error updating role:', error);
    return errorResponse(res, 'Failed to update role', 500);
  }
};

/**
 * Delete role
 * DELETE /api/roles/:id
 */
export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Check if role exists and belongs to user's gym
    const role = await prisma.role.findFirst({
      where: {
        id,
        gymId: user.gymId,
        deletedAt: null
      }
    });

    if (!role) {
      return errorResponse(res, 'Role not found', 404);
    }

    // Prevent deleting system roles
    const systemRoles = ['SuperAdmin', 'GymOwner', 'Trainer', 'Student'];
    if (systemRoles.includes(role.name)) {
      return errorResponse(res, 'Cannot delete system roles', 400);
    }

    // Check if role is assigned to any users
    const usersCount = await prisma.user.count({
      where: {
        roleId: id,
        deletedAt: null
      }
    });

    if (usersCount > 0) {
      return errorResponse(
        res,
        `Cannot delete role. It is assigned to ${usersCount} user(s). Please reassign users first.`,
        400
      );
    }

    // Soft delete
    await prisma.role.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return successResponse(res, null, 'Role deleted successfully');
  } catch (error) {
    console.error('Error deleting role:', error);
    return errorResponse(res, 'Failed to delete role', 500);
  }
};

/**
 * Get role templates (default role configurations)
 * GET /api/roles/templates
 */
export const getRoleTemplates = async (_req: Request, res: Response) => {
  try {
    const templates = [
      {
        name: 'GymOwner',
        description: 'Full access to all gym resources',
        permissions: {
          users: { read: true, create: true, update: true, delete: true },
          roles: { read: true, create: true, update: true, delete: true },
          gyms: { read: true, update: true },
          trainers: { read: true, create: true, update: true, delete: true },
          students: { read: true, create: true, update: true, delete: true },
          programs: { read: true, create: true, update: true, delete: true },
          exercises: { read: true, create: true, update: true, delete: true },
          equipment: { read: true, create: true, update: true, delete: true },
          products: { read: true, create: true, update: true, delete: true },
          orders: { read: true, create: true, update: true, delete: true }
        }
      },
      {
        name: 'Trainer',
        description: 'Can manage students and training programs',
        permissions: {
          users: { read: true },
          students: { read: true, update: true },
          programs: { read: true, create: true, update: true, delete: true },
          exercises: { read: true },
          workouts: { read: true },
          equipment: { read: true }
        }
      },
      {
        name: 'Student',
        description: 'Can view and log workouts, order products',
        permissions: {
          workouts: { read: true, create: true },
          programs: { read: true },
          products: { read: true },
          orders: { create: true, read: true }
        }
      },
      {
        name: 'Receptionist',
        description: 'Can manage students and view basic information',
        permissions: {
          users: { read: true, create: true },
          students: { read: true, create: true, update: true },
          products: { read: true },
          orders: { read: true, create: true, update: true }
        }
      },
      {
        name: 'Assistant Trainer',
        description: 'Can view and update training programs',
        permissions: {
          users: { read: true },
          students: { read: true },
          programs: { read: true, update: true },
          exercises: { read: true },
          workouts: { read: true }
        }
      }
    ];

    return successResponse(res, templates);
  } catch (error) {
    console.error('Error fetching role templates:', error);
    return errorResponse(res, 'Failed to fetch role templates', 500);
  }
};

/**
 * Clone role from template
 * POST /api/roles/from-template
 */
export const createRoleFromTemplate = async (req: Request, res: Response) => {
  try {
    const { templateName, customName } = req.body;
    const user = (req as any).user;

    // Get template permissions
    const templates = {
      GymOwner: {
        users: { read: true, create: true, update: true, delete: true },
        roles: { read: true, create: true, update: true, delete: true },
        gyms: { read: true, update: true },
        trainers: { read: true, create: true, update: true, delete: true },
        students: { read: true, create: true, update: true, delete: true },
        programs: { read: true, create: true, update: true, delete: true },
        exercises: { read: true, create: true, update: true, delete: true },
        equipment: { read: true, create: true, update: true, delete: true },
        products: { read: true, create: true, update: true, delete: true },
        orders: { read: true, create: true, update: true, delete: true }
      },
      Trainer: {
        users: { read: true },
        students: { read: true, update: true },
        programs: { read: true, create: true, update: true, delete: true },
        exercises: { read: true },
        workouts: { read: true },
        equipment: { read: true }
      },
      Student: {
        workouts: { read: true, create: true },
        programs: { read: true },
        products: { read: true },
        orders: { create: true, read: true }
      },
      Receptionist: {
        users: { read: true, create: true },
        students: { read: true, create: true, update: true },
        products: { read: true },
        orders: { read: true, create: true, update: true }
      },
      'Assistant Trainer': {
        users: { read: true },
        students: { read: true },
        programs: { read: true, update: true },
        exercises: { read: true },
        workouts: { read: true }
      }
    };

    const permissions = templates[templateName as keyof typeof templates];
    if (!permissions) {
      return errorResponse(res, 'Invalid template name', 400);
    }

    const roleName = customName || templateName;

    // Check if role already exists
    const existingRole = await prisma.role.findUnique({
      where: {
        gymId_name: {
          gymId: user.gymId,
          name: roleName
        }
      }
    });

    if (existingRole) {
      return errorResponse(res, 'Role with this name already exists', 409);
    }

    const role = await prisma.role.create({
      data: {
        gymId: user.gymId,
        name: roleName,
        permissions
      }
    });

    return successResponse(res, role, 'Role created from template successfully', 201);
  } catch (error) {
    console.error('Error creating role from template:', error);
    return errorResponse(res, 'Failed to create role from template', 500);
  }
};
