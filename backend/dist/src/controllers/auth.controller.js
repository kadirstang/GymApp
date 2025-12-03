"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshAccessToken = exports.getCurrentUser = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const prisma = new client_1.PrismaClient();
const register = async (req, res, next) => {
    try {
        const { email, password, firstName, lastName, phone, gymId, roleId } = req.body;
        if (!email || !password || !firstName || !lastName || !gymId || !roleId) {
            throw new errors_1.ValidationError('All required fields must be provided');
        }
        if (password.length < 6) {
            throw new errors_1.ValidationError('Password must be at least 6 characters');
        }
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new errors_1.ConflictError('Email already registered');
        }
        const gym = await prisma.gym.findUnique({
            where: { id: gymId },
        });
        if (!gym || !gym.isActive) {
            throw new errors_1.ValidationError('Invalid or inactive gym');
        }
        const role = await prisma.role.findUnique({
            where: { id: roleId },
        });
        if (!role || role.gymId !== gymId) {
            throw new errors_1.ValidationError('Invalid role for this gym');
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                firstName,
                lastName,
                phone,
                gymId,
                roleId,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                gymId: true,
                roleId: true,
                createdAt: true,
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
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            email: user.email,
            gymId: user.gymId,
            roleId: user.roleId,
        });
        const refreshToken = (0, jwt_1.generateRefreshToken)({
            userId: user.id,
            email: user.email,
            gymId: user.gymId,
            roleId: user.roleId,
        });
        (0, response_1.successResponse)(res, {
            user,
            token,
            refreshToken,
        }, 'User registered successfully', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new errors_1.ValidationError('Email and password are required');
        }
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                passwordHash: true,
                firstName: true,
                lastName: true,
                phone: true,
                gymId: true,
                roleId: true,
                gym: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        isActive: true,
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
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        if (!user.gym.isActive) {
            throw new errors_1.UnauthorizedError('Your gym account is inactive');
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            email: user.email,
            gymId: user.gymId,
            roleId: user.roleId,
        });
        const refreshToken = (0, jwt_1.generateRefreshToken)({
            userId: user.id,
            email: user.email,
            gymId: user.gymId,
            roleId: user.roleId,
        });
        const { passwordHash, ...userWithoutPassword } = user;
        (0, response_1.successResponse)(res, {
            user: userWithoutPassword,
            token,
            refreshToken,
        }, 'Login successful');
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const getCurrentUser = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
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
                        address: true,
                        contactPhone: true,
                        logoUrl: true,
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
            throw new errors_1.UnauthorizedError('User not found');
        }
        (0, response_1.successResponse)(res, user, 'User profile retrieved');
    }
    catch (error) {
        next(error);
    }
};
exports.getCurrentUser = getCurrentUser;
const refreshAccessToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            throw new errors_1.ValidationError('Refresh token is required');
        }
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.UnauthorizedError('Invalid refresh token');
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                gymId: true,
                roleId: true,
            },
        });
        if (!user) {
            throw new errors_1.UnauthorizedError('User not found');
        }
        const newToken = (0, jwt_1.generateToken)({
            userId: user.id,
            email: user.email,
            gymId: user.gymId,
            roleId: user.roleId,
        });
        (0, response_1.successResponse)(res, { token: newToken }, 'Token refreshed successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.refreshAccessToken = refreshAccessToken;
//# sourceMappingURL=auth.controller.js.map