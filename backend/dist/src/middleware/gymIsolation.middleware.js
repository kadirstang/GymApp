"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowSuperAdminBypass = exports.verifySameGymUser = exports.verifyResourceGymOwnership = exports.enforceGymIsolation = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const prisma = new client_1.PrismaClient();
const enforceGymIsolation = async (req, _res, next) => {
    try {
        const userGymId = req.user?.gymId;
        if (!userGymId) {
            throw new errors_1.UnauthorizedError('User gym information not found');
        }
        req.gymId = userGymId;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.enforceGymIsolation = enforceGymIsolation;
const verifyResourceGymOwnership = (model, resourceIdParam = 'id') => {
    return async (req, _res, next) => {
        try {
            const userGymId = req.user?.gymId;
            const resourceId = req.params[resourceIdParam];
            if (!userGymId) {
                throw new errors_1.UnauthorizedError('User gym information not found');
            }
            if (!resourceId) {
                throw new errors_1.NotFoundError(`Resource ID parameter '${resourceIdParam}' not found`);
            }
            const prismaModel = prisma[model];
            if (!prismaModel) {
                throw new Error(`Invalid model: ${model}`);
            }
            const resource = await prismaModel.findUnique({
                where: { id: resourceId },
                select: { gymId: true },
            });
            if (!resource) {
                throw new errors_1.NotFoundError(`${model} not found`);
            }
            if (resource.gymId !== userGymId) {
                throw new errors_1.ForbiddenError('You cannot access resources from another gym');
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.verifyResourceGymOwnership = verifyResourceGymOwnership;
const verifySameGymUser = (userIdParam = 'userId') => {
    return async (req, _res, next) => {
        try {
            const currentUserGymId = req.user?.gymId;
            const targetUserId = req.params[userIdParam];
            if (!currentUserGymId) {
                throw new errors_1.UnauthorizedError('User gym information not found');
            }
            if (!targetUserId) {
                throw new errors_1.NotFoundError(`User ID parameter '${userIdParam}' not found`);
            }
            const targetUser = await prisma.user.findUnique({
                where: { id: targetUserId },
                select: { gymId: true },
            });
            if (!targetUser) {
                throw new errors_1.NotFoundError('User not found');
            }
            if (targetUser.gymId !== currentUserGymId) {
                throw new errors_1.ForbiddenError('You cannot access users from another gym');
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.verifySameGymUser = verifySameGymUser;
const allowSuperAdminBypass = async (req, _res, next) => {
    try {
        const roleId = req.user?.roleId;
        if (!roleId) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        const role = await prisma.role.findUnique({
            where: { id: roleId },
            select: { name: true },
        });
        if (role?.name === 'SuperAdmin') {
            req.isSuperAdmin = true;
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.allowSuperAdminBypass = allowSuperAdminBypass;
//# sourceMappingURL=gymIsolation.middleware.js.map