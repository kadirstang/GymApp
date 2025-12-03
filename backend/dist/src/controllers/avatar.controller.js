"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserAvatar = exports.uploadAvatar = void 0;
const client_1 = require("@prisma/client");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const upload_middleware_1 = require("../middleware/upload.middleware");
const prisma = new client_1.PrismaClient();
const uploadAvatar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const gymId = req.user?.gymId;
        const userId = req.user?.userId;
        if (!req.file) {
            throw new errors_1.ValidationError('No file uploaded');
        }
        const user = await prisma.user.findFirst({
            where: { id, gymId, deletedAt: null },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        if (id !== userId) {
            const currentUser = await prisma.user.findUnique({
                where: { id: userId },
                include: { role: true },
            });
            const permissions = currentUser?.role?.permissions;
            if (!permissions?.users?.update) {
                throw new errors_1.ValidationError('You can only update your own avatar');
            }
        }
        if (user.avatarUrl) {
            (0, upload_middleware_1.deleteAvatar)(user.avatarUrl);
        }
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { avatarUrl },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
            },
        });
        (0, response_1.successResponse)(res, updatedUser, 'Avatar uploaded successfully');
    }
    catch (error) {
        if (req.file) {
            (0, upload_middleware_1.deleteAvatar)(`/uploads/avatars/${req.file.filename}`);
        }
        next(error);
    }
};
exports.uploadAvatar = uploadAvatar;
const deleteUserAvatar = async (req, _res, next) => {
    try {
        const { id } = req.params;
        const gymId = req.user?.gymId;
        const userId = req.user?.userId;
        const user = await prisma.user.findFirst({
            where: { id, gymId, deletedAt: null },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        if (id !== userId) {
            const currentUser = await prisma.user.findUnique({
                where: { id: userId },
                include: { role: true },
            });
            const permissions = currentUser?.role?.permissions;
            if (!permissions?.users?.update) {
                throw new errors_1.ValidationError('You can only delete your own avatar');
            }
        }
        if (!user.avatarUrl) {
            throw new errors_1.ValidationError('User has no avatar to delete');
        }
        (0, upload_middleware_1.deleteAvatar)(user.avatarUrl);
        await prisma.user.update({
            where: { id },
            data: { avatarUrl: null },
        });
        (0, response_1.successResponse)(_res, null, 'Avatar deleted successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.deleteUserAvatar = deleteUserAvatar;
//# sourceMappingURL=avatar.controller.js.map