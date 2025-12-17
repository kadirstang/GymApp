"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoleFromTemplate = exports.getRoleTemplates = exports.deleteRole = exports.updateRole = exports.createRole = exports.getRoleById = exports.getRoles = void 0;
const client_1 = require("@prisma/client");
const response_js_1 = require("../utils/response.js");
const prisma = new client_1.PrismaClient();
const getRoles = async (req, res) => {
    try {
        const user = req.user;
        const { page = 1, limit = 50 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {
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
        return (0, response_js_1.successResponse)(res, {
            items: roles,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Error fetching roles:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to fetch roles', 500);
    }
};
exports.getRoles = getRoles;
const getRoleById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
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
            return (0, response_js_1.errorResponse)(res, 'Role not found', 404);
        }
        return (0, response_js_1.successResponse)(res, role);
    }
    catch (error) {
        console.error('Error fetching role:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to fetch role', 500);
    }
};
exports.getRoleById = getRoleById;
const createRole = async (req, res) => {
    try {
        const { name, permissions } = req.body;
        const user = req.user;
        const existingRole = await prisma.role.findUnique({
            where: {
                gymId_name: {
                    gymId: user.gymId,
                    name
                }
            }
        });
        if (existingRole) {
            return (0, response_js_1.errorResponse)(res, 'Role with this name already exists in your gym', 409);
        }
        const role = await prisma.role.create({
            data: {
                gymId: user.gymId,
                name,
                permissions: permissions || {}
            }
        });
        return (0, response_js_1.successResponse)(res, role, 'Role created successfully', 201);
    }
    catch (error) {
        console.error('Error creating role:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to create role', 500);
    }
};
exports.createRole = createRole;
const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, permissions } = req.body;
        const user = req.user;
        const role = await prisma.role.findFirst({
            where: {
                id,
                gymId: user.gymId,
                deletedAt: null
            }
        });
        if (!role) {
            return (0, response_js_1.errorResponse)(res, 'Role not found', 404);
        }
        const systemRoles = ['SuperAdmin', 'GymOwner', 'Trainer', 'Student'];
        if (systemRoles.includes(role.name) && name && name !== role.name) {
            return (0, response_js_1.errorResponse)(res, 'Cannot rename system roles', 400);
        }
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
                return (0, response_js_1.errorResponse)(res, 'Role with this name already exists', 409);
            }
        }
        const updatedRole = await prisma.role.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(permissions && { permissions })
            }
        });
        return (0, response_js_1.successResponse)(res, updatedRole, 'Role updated successfully');
    }
    catch (error) {
        console.error('Error updating role:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to update role', 500);
    }
};
exports.updateRole = updateRole;
const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const role = await prisma.role.findFirst({
            where: {
                id,
                gymId: user.gymId,
                deletedAt: null
            }
        });
        if (!role) {
            return (0, response_js_1.errorResponse)(res, 'Role not found', 404);
        }
        const systemRoles = ['SuperAdmin', 'GymOwner', 'Trainer', 'Student'];
        if (systemRoles.includes(role.name)) {
            return (0, response_js_1.errorResponse)(res, 'Cannot delete system roles', 400);
        }
        const usersCount = await prisma.user.count({
            where: {
                roleId: id,
                deletedAt: null
            }
        });
        if (usersCount > 0) {
            return (0, response_js_1.errorResponse)(res, `Cannot delete role. It is assigned to ${usersCount} user(s). Please reassign users first.`, 400);
        }
        await prisma.role.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
        return (0, response_js_1.successResponse)(res, null, 'Role deleted successfully');
    }
    catch (error) {
        console.error('Error deleting role:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to delete role', 500);
    }
};
exports.deleteRole = deleteRole;
const getRoleTemplates = async (_req, res) => {
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
        return (0, response_js_1.successResponse)(res, templates);
    }
    catch (error) {
        console.error('Error fetching role templates:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to fetch role templates', 500);
    }
};
exports.getRoleTemplates = getRoleTemplates;
const createRoleFromTemplate = async (req, res) => {
    try {
        const { templateName, customName } = req.body;
        const user = req.user;
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
        const permissions = templates[templateName];
        if (!permissions) {
            return (0, response_js_1.errorResponse)(res, 'Invalid template name', 400);
        }
        const roleName = customName || templateName;
        const existingRole = await prisma.role.findUnique({
            where: {
                gymId_name: {
                    gymId: user.gymId,
                    name: roleName
                }
            }
        });
        if (existingRole) {
            return (0, response_js_1.errorResponse)(res, 'Role with this name already exists', 409);
        }
        const role = await prisma.role.create({
            data: {
                gymId: user.gymId,
                name: roleName,
                permissions
            }
        });
        return (0, response_js_1.successResponse)(res, role, 'Role created from template successfully', 201);
    }
    catch (error) {
        console.error('Error creating role from template:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to create role from template', 500);
    }
};
exports.createRoleFromTemplate = createRoleFromTemplate;
//# sourceMappingURL=role.controller.js.map