"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGymStats = exports.deleteGym = exports.toggleGymActive = exports.updateGym = exports.createGym = exports.getGymById = exports.getGyms = void 0;
const client_1 = require("@prisma/client");
const response_js_1 = require("../utils/response.js");
const prisma = new client_1.PrismaClient();
const getGyms = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, isActive } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {
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
        return (0, response_js_1.successResponse)(res, {
            items: gyms,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Error fetching gyms:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to fetch gyms', 500);
    }
};
exports.getGyms = getGyms;
const getGymById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const where = {
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
            return (0, response_js_1.errorResponse)(res, 'Gym not found', 404);
        }
        return (0, response_js_1.successResponse)(res, gym);
    }
    catch (error) {
        console.error('Error fetching gym:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to fetch gym', 500);
    }
};
exports.getGymById = getGymById;
const createGym = async (req, res) => {
    try {
        const { name, slug, address, contactPhone, logoUrl } = req.body;
        const existingGym = await prisma.gym.findUnique({
            where: { slug }
        });
        if (existingGym) {
            return (0, response_js_1.errorResponse)(res, 'Gym with this slug already exists', 409);
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
        return (0, response_js_1.successResponse)(res, gym, 'Gym created successfully', 201);
    }
    catch (error) {
        console.error('Error creating gym:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to create gym', 500);
    }
};
exports.createGym = createGym;
const updateGym = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, address, contactPhone, contactEmail, website, logoUrl } = req.body;
        const user = req.user;
        const where = {
            id,
            deletedAt: null
        };
        if (user.role !== 'SuperAdmin') {
            where.id = user.gymId;
        }
        const gym = await prisma.gym.findFirst({ where });
        if (!gym) {
            return (0, response_js_1.errorResponse)(res, 'Gym not found', 404);
        }
        if (slug && slug !== gym.slug) {
            const existingGym = await prisma.gym.findUnique({
                where: { slug }
            });
            if (existingGym) {
                return (0, response_js_1.errorResponse)(res, 'Gym with this slug already exists', 409);
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
        return (0, response_js_1.successResponse)(res, updatedGym, 'Gym updated successfully');
    }
    catch (error) {
        console.error('Error updating gym:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to update gym', 500);
    }
};
exports.updateGym = updateGym;
const toggleGymActive = async (req, res) => {
    try {
        const { id } = req.params;
        const gym = await prisma.gym.findFirst({
            where: { id, deletedAt: null }
        });
        if (!gym) {
            return (0, response_js_1.errorResponse)(res, 'Gym not found', 404);
        }
        const updatedGym = await prisma.gym.update({
            where: { id },
            data: {
                isActive: !gym.isActive
            }
        });
        return (0, response_js_1.successResponse)(res, updatedGym, `Gym ${updatedGym.isActive ? 'activated' : 'deactivated'} successfully`);
    }
    catch (error) {
        console.error('Error toggling gym status:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to toggle gym status', 500);
    }
};
exports.toggleGymActive = toggleGymActive;
const deleteGym = async (req, res) => {
    try {
        const { id } = req.params;
        const gym = await prisma.gym.findFirst({
            where: { id, deletedAt: null }
        });
        if (!gym) {
            return (0, response_js_1.errorResponse)(res, 'Gym not found', 404);
        }
        await prisma.gym.update({
            where: { id },
            data: {
                deletedAt: new Date()
            }
        });
        return (0, response_js_1.successResponse)(res, null, 'Gym deleted successfully');
    }
    catch (error) {
        console.error('Error deleting gym:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to delete gym', 500);
    }
};
exports.deleteGym = deleteGym;
const getGymStats = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        if (user.role !== 'SuperAdmin' && user.gymId !== id) {
            return (0, response_js_1.errorResponse)(res, 'Unauthorized', 403);
        }
        const gym = await prisma.gym.findFirst({
            where: { id, deletedAt: null }
        });
        if (!gym) {
            return (0, response_js_1.errorResponse)(res, 'Gym not found', 404);
        }
        const [totalUsers, activeUsers, totalPrograms, totalExercises, totalEquipments, totalProducts, totalOrders, recentOrders] = await Promise.all([
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
                                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
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
        return (0, response_js_1.successResponse)(res, {
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
    }
    catch (error) {
        console.error('Error fetching gym stats:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to fetch gym statistics', 500);
    }
};
exports.getGymStats = getGymStats;
//# sourceMappingURL=gym.controller.js.map