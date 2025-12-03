"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAllPermissions = exports.requireAnyPermission = exports.requirePermission = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const prisma = new client_1.PrismaClient();
const requirePermission = (requiredPermission) => {
    return async (req, _res, next) => {
        try {
            const userId = req.user?.userId;
            const roleId = req.user?.roleId;
            if (!userId || !roleId) {
                throw new errors_1.UnauthorizedError('Not authenticated');
            }
            const role = await prisma.role.findUnique({
                where: { id: roleId },
                select: {
                    name: true,
                    permissions: true,
                },
            });
            if (!role) {
                throw new errors_1.ForbiddenError('Role not found');
            }
            const permissions = role.permissions;
            const [resource, action] = requiredPermission.split('.');
            if (!resource || !action) {
                throw new Error('Invalid permission format. Use "resource.action"');
            }
            const hasPermission = permissions &&
                permissions[resource] &&
                permissions[resource][action] === true;
            if (!hasPermission) {
                throw new errors_1.ForbiddenError(`You don't have permission to ${action} ${resource}`);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requirePermission = requirePermission;
const requireAnyPermission = (requiredPermissions) => {
    return async (req, _res, next) => {
        try {
            const userId = req.user?.userId;
            const roleId = req.user?.roleId;
            if (!userId || !roleId) {
                throw new errors_1.UnauthorizedError('Not authenticated');
            }
            const role = await prisma.role.findUnique({
                where: { id: roleId },
                select: {
                    name: true,
                    permissions: true,
                },
            });
            if (!role) {
                throw new errors_1.ForbiddenError('Role not found');
            }
            const permissions = role.permissions;
            const hasAnyPermission = requiredPermissions.some(permission => {
                const [resource, action] = permission.split('.');
                return permissions?.[resource]?.[action] === true;
            });
            if (!hasAnyPermission) {
                throw new errors_1.ForbiddenError('You don\'t have the required permissions');
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireAnyPermission = requireAnyPermission;
const requireAllPermissions = (requiredPermissions) => {
    return async (req, _res, next) => {
        try {
            const userId = req.user?.userId;
            const roleId = req.user?.roleId;
            if (!userId || !roleId) {
                throw new errors_1.UnauthorizedError('Not authenticated');
            }
            const role = await prisma.role.findUnique({
                where: { id: roleId },
                select: {
                    name: true,
                    permissions: true,
                },
            });
            if (!role) {
                throw new errors_1.ForbiddenError('Role not found');
            }
            const permissions = role.permissions;
            const hasAllPermissions = requiredPermissions.every(permission => {
                const [resource, action] = permission.split('.');
                return permissions?.[resource]?.[action] === true;
            });
            if (!hasAllPermissions) {
                throw new errors_1.ForbiddenError('You don\'t have all the required permissions');
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireAllPermissions = requireAllPermissions;
const requireRole = (allowedRoles) => {
    return async (req, _res, next) => {
        try {
            const userId = req.user?.userId;
            const roleId = req.user?.roleId;
            if (!userId || !roleId) {
                throw new errors_1.UnauthorizedError('Not authenticated');
            }
            const role = await prisma.role.findUnique({
                where: { id: roleId },
                select: {
                    name: true,
                },
            });
            if (!role) {
                throw new errors_1.ForbiddenError('Role not found');
            }
            if (!allowedRoles.includes(role.name)) {
                throw new errors_1.ForbiddenError(`This action requires one of these roles: ${allowedRoles.join(', ')}`);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=rbac.middleware.js.map