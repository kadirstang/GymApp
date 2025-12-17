"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserMeasurement = exports.updateUserMeasurement = exports.addUserMeasurement = exports.getUserMeasurements = exports.deleteUser = exports.updateCustomPermissions = exports.changePassword = exports.updateUser = exports.getUserById = exports.getUsers = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const prisma = new client_1.PrismaClient();
const getUsers = async (req, _res, next) => {
    try {
        const gymId = req.user?.gymId;
        const { page = 1, limit = 10, role, search } = req.query;
        if (!gymId) {
            throw new errors_1.ValidationError('Gym ID required');
        }
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const where = {
            gymId,
            deletedAt: null,
        };
        if (role) {
            where.role = { name: role };
        }
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limitNum,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    avatarUrl: true,
                    birthDate: true,
                    gender: true,
                    roleId: true,
                    createdAt: true,
                    role: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    trainerMatchesAsStudent: {
                        where: {
                            status: 'active',
                            deletedAt: null,
                        },
                        select: { id: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.user.count({ where }),
        ]);
        const usersWithBadge = users.map(user => ({
            ...user,
            hasPrivateTraining: user.trainerMatchesAsStudent.length > 0,
            trainerMatchesAsStudent: undefined,
        }));
        return (0, response_1.successResponse)(_res, {
            items: usersWithBadge,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUsers = getUsers;
const getUserById = async (req, _res, next) => {
    try {
        const { id } = req.params;
        const gymId = req.user?.gymId;
        const user = await prisma.user.findFirst({
            where: {
                id,
                gymId,
                deletedAt: null,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                avatarUrl: true,
                birthDate: true,
                gender: true,
                gymId: true,
                roleId: true,
                createdAt: true,
                updatedAt: true,
                gym: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                role: {
                    select: {
                        id: true,
                        name: true,
                        permissions: true,
                    },
                },
            },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        (0, response_1.successResponse)(_res, user, 'User retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getUserById = getUserById;
const updateUser = async (req, _res, next) => {
    try {
        const { id } = req.params;
        const gymId = req.user?.gymId;
        const userId = req.user?.userId;
        const { firstName, lastName, phone, avatarUrl, birthDate, gender, roleId } = req.body;
        const existingUser = await prisma.user.findFirst({
            where: { id, gymId, deletedAt: null },
            include: { role: true },
        });
        if (!existingUser) {
            throw new errors_1.NotFoundError('User not found');
        }
        if (id !== userId) {
            const currentUser = await prisma.user.findUnique({
                where: { id: userId },
                include: { role: true },
            });
            const permissions = currentUser?.role?.permissions;
            if (!permissions?.users?.update) {
                throw new errors_1.ForbiddenError('You can only update your own profile');
            }
        }
        if (roleId && roleId !== existingUser.roleId) {
            const role = await prisma.role.findFirst({
                where: { id: roleId, gymId },
            });
            if (!role) {
                throw new errors_1.ValidationError('Invalid role');
            }
        }
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                firstName: firstName || existingUser.firstName,
                lastName: lastName || existingUser.lastName,
                phone: phone !== undefined ? phone : existingUser.phone,
                avatarUrl: avatarUrl !== undefined ? avatarUrl : existingUser.avatarUrl,
                birthDate: birthDate !== undefined ? new Date(birthDate) : existingUser.birthDate,
                gender: gender !== undefined ? gender : existingUser.gender,
                roleId: roleId || existingUser.roleId,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                avatarUrl: true,
                birthDate: true,
                gender: true,
                roleId: true,
                updatedAt: true,
                role: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        (0, response_1.successResponse)(_res, updatedUser, 'User updated successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.updateUser = updateUser;
const changePassword = async (req, _res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            throw new errors_1.ValidationError('Current password and new password are required');
        }
        if (newPassword.length < 6) {
            throw new errors_1.ValidationError('New password must be at least 6 characters');
        }
        if (id !== userId) {
            throw new errors_1.ForbiddenError('You can only change your own password');
        }
        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, passwordHash: true },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        const isValidPassword = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!isValidPassword) {
            throw new errors_1.ValidationError('Current password is incorrect');
        }
        const newPasswordHash = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma.user.update({
            where: { id },
            data: { passwordHash: newPasswordHash },
        });
        (0, response_1.successResponse)(_res, null, 'Password changed successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.changePassword = changePassword;
const updateCustomPermissions = async (req, _res, next) => {
    try {
        const { id } = req.params;
        const { customPermissions } = req.body;
        const gymId = req.user?.gymId;
        if (!customPermissions || typeof customPermissions !== 'object') {
            throw new errors_1.ValidationError('Custom permissions must be an object');
        }
        const targetUser = await prisma.user.findFirst({
            where: {
                id,
                gymId,
                deletedAt: null,
            },
            include: {
                role: true,
            },
        });
        if (!targetUser) {
            throw new errors_1.NotFoundError('User not found');
        }
        if (targetUser.role.name !== 'Trainer') {
            throw new errors_1.ValidationError('Custom permissions can only be set for Trainers');
        }
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { customPermissions },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                customPermissions: true,
                role: {
                    select: {
                        name: true,
                        permissions: true,
                    },
                },
            },
        });
        (0, response_1.successResponse)(_res, updatedUser, 'Custom permissions updated successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.updateCustomPermissions = updateCustomPermissions;
const deleteUser = async (req, _res, next) => {
    try {
        const { id } = req.params;
        const gymId = req.user?.gymId;
        const user = await prisma.user.findFirst({
            where: { id, gymId, deletedAt: null },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        await prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        (0, response_1.successResponse)(_res, null, 'User deleted successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.deleteUser = deleteUser;
const getUserMeasurements = async (req, _res, next) => {
    try {
        const { id } = req.params;
        const gymId = req.user?.gymId;
        const { limit = 10 } = req.query;
        const user = await prisma.user.findFirst({
            where: { id, gymId, deletedAt: null },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        const measurements = await prisma.userMeasurement.findMany({
            where: { userId: id },
            orderBy: { measuredAt: 'desc' },
            take: parseInt(limit, 10),
        });
        (0, response_1.successResponse)(_res, measurements, 'Measurements retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getUserMeasurements = getUserMeasurements;
const addUserMeasurement = async (req, _res, next) => {
    try {
        const { id } = req.params;
        const gymId = req.user?.gymId;
        const { weight, height, bodyFatPercentage, muscleMass } = req.body;
        const user = await prisma.user.findFirst({
            where: { id, gymId, deletedAt: null },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        const measurement = await prisma.userMeasurement.create({
            data: {
                userId: id,
                weight: weight ? parseFloat(weight) : null,
                height: height ? parseFloat(height) : null,
                bodyFatPercentage: bodyFatPercentage ? parseFloat(bodyFatPercentage) : null,
                muscleMass: muscleMass ? parseFloat(muscleMass) : null,
            },
        });
        (0, response_1.successResponse)(_res, measurement, 'Measurement added successfully', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.addUserMeasurement = addUserMeasurement;
const updateUserMeasurement = async (req, _res, next) => {
    try {
        const { userId, measurementId } = req.params;
        const gymId = req.user?.gymId;
        const { weight, height, bodyFatPercentage, muscleMass } = req.body;
        const user = await prisma.user.findFirst({
            where: { id: userId, gymId, deletedAt: null },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        const existingMeasurement = await prisma.userMeasurement.findFirst({
            where: { id: measurementId, userId },
        });
        if (!existingMeasurement) {
            throw new errors_1.NotFoundError('Measurement not found');
        }
        const measurement = await prisma.userMeasurement.update({
            where: { id: measurementId },
            data: {
                weight: weight !== undefined ? parseFloat(weight) : existingMeasurement.weight,
                height: height !== undefined ? parseFloat(height) : existingMeasurement.height,
                bodyFatPercentage: bodyFatPercentage !== undefined ? parseFloat(bodyFatPercentage) : existingMeasurement.bodyFatPercentage,
                muscleMass: muscleMass !== undefined ? parseFloat(muscleMass) : existingMeasurement.muscleMass,
            },
        });
        (0, response_1.successResponse)(_res, measurement, 'Measurement updated successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.updateUserMeasurement = updateUserMeasurement;
const deleteUserMeasurement = async (req, _res, next) => {
    try {
        const { userId, measurementId } = req.params;
        const gymId = req.user?.gymId;
        const user = await prisma.user.findFirst({
            where: { id: userId, gymId, deletedAt: null },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        const measurement = await prisma.userMeasurement.findFirst({
            where: { id: measurementId, userId },
        });
        if (!measurement) {
            throw new errors_1.NotFoundError('Measurement not found');
        }
        await prisma.userMeasurement.delete({
            where: { id: measurementId },
        });
        (0, response_1.successResponse)(_res, null, 'Measurement deleted successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.deleteUserMeasurement = deleteUserMeasurement;
//# sourceMappingURL=user.controller.js.map