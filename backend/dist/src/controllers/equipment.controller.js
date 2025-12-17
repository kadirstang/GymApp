"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQRCode = exports.getEquipmentByQR = exports.getEquipmentStats = exports.deleteEquipment = exports.updateEquipment = exports.createEquipment = exports.getEquipmentById = exports.getEquipment = void 0;
const client_1 = require("@prisma/client");
const response_1 = require("../utils/response");
const qrcode_1 = __importDefault(require("qrcode"));
const prisma = new client_1.PrismaClient();
const getEquipment = async (req, res) => {
    try {
        const { gymId } = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const search = req.query.search;
        const status = req.query.status;
        const where = {
            gymId,
            deletedAt: null,
        };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status && ['active', 'maintenance', 'broken'].includes(status)) {
            where.status = status;
        }
        const [equipment, total] = await Promise.all([
            prisma.equipment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    qrCodeUuid: true,
                    videoUrl: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            exercises: true,
                        },
                    },
                },
            }),
            prisma.equipment.count({ where }),
        ]);
        return (0, response_1.successResponse)(res, {
            items: equipment,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error('Get equipment error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to retrieve equipment', 500);
    }
};
exports.getEquipment = getEquipment;
const getEquipmentById = async (req, res) => {
    try {
        const { gymId } = req.user;
        const { id } = req.params;
        const equipment = await prisma.equipment.findFirst({
            where: {
                id,
                gymId,
                deletedAt: null,
            },
            include: {
                exercises: {
                    where: { deletedAt: null },
                    select: {
                        id: true,
                        name: true,
                        targetMuscleGroup: true,
                    },
                },
            },
        });
        if (!equipment) {
            return (0, response_1.errorResponse)(res, 'Equipment not found', 404);
        }
        return (0, response_1.successResponse)(res, equipment);
    }
    catch (error) {
        console.error('Get equipment by ID error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to retrieve equipment', 500);
    }
};
exports.getEquipmentById = getEquipmentById;
const createEquipment = async (req, res) => {
    try {
        const { gymId } = req.user;
        const { name, description, videoUrl, status } = req.body;
        const existing = await prisma.equipment.findFirst({
            where: {
                name,
                gymId,
                deletedAt: null,
            },
        });
        if (existing) {
            return (0, response_1.errorResponse)(res, 'Equipment with this name already exists', 409);
        }
        const equipment = await prisma.equipment.create({
            data: {
                gymId,
                name,
                description: description || null,
                videoUrl: videoUrl || null,
                status: status || 'active',
            },
            select: {
                id: true,
                name: true,
                description: true,
                qrCodeUuid: true,
                videoUrl: true,
                status: true,
                createdAt: true,
            },
        });
        return (0, response_1.successResponse)(res, equipment, 'Equipment created successfully', 201);
    }
    catch (error) {
        console.error('Create equipment error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to create equipment', 500);
    }
};
exports.createEquipment = createEquipment;
const updateEquipment = async (req, res) => {
    try {
        const { gymId } = req.user;
        const { id } = req.params;
        const { name, description, videoUrl, status } = req.body;
        const existing = await prisma.equipment.findFirst({
            where: {
                id,
                gymId,
                deletedAt: null,
            },
        });
        if (!existing) {
            return (0, response_1.errorResponse)(res, 'Equipment not found', 404);
        }
        if (name && name !== existing.name) {
            const duplicate = await prisma.equipment.findFirst({
                where: {
                    name,
                    gymId,
                    deletedAt: null,
                    id: { not: id },
                },
            });
            if (duplicate) {
                return (0, response_1.errorResponse)(res, 'Equipment with this name already exists', 409);
            }
        }
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (description !== undefined)
            updateData.description = description;
        if (videoUrl !== undefined)
            updateData.videoUrl = videoUrl;
        if (status !== undefined)
            updateData.status = status;
        const equipment = await prisma.equipment.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                description: true,
                qrCodeUuid: true,
                videoUrl: true,
                status: true,
                updatedAt: true,
            },
        });
        return (0, response_1.successResponse)(res, equipment, 'Equipment updated successfully');
    }
    catch (error) {
        console.error('Update equipment error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to update equipment', 500);
    }
};
exports.updateEquipment = updateEquipment;
const deleteEquipment = async (req, res) => {
    try {
        const { gymId } = req.user;
        const { id } = req.params;
        const existing = await prisma.equipment.findFirst({
            where: {
                id,
                gymId,
                deletedAt: null,
            },
            include: {
                _count: {
                    select: {
                        exercises: true,
                    },
                },
            },
        });
        if (!existing) {
            return (0, response_1.errorResponse)(res, 'Equipment not found', 404);
        }
        if (existing._count.exercises > 0) {
            return (0, response_1.errorResponse)(res, `Cannot delete equipment that is used in ${existing._count.exercises} exercise(s)`, 400);
        }
        await prisma.equipment.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return (0, response_1.successResponse)(res, null, 'Equipment deleted successfully');
    }
    catch (error) {
        console.error('Delete equipment error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to delete equipment', 500);
    }
};
exports.deleteEquipment = deleteEquipment;
const getEquipmentStats = async (req, res) => {
    try {
        const { gymId } = req.user;
        const [total, byStatus, withExercises] = await Promise.all([
            prisma.equipment.count({
                where: {
                    gymId,
                    deletedAt: null,
                },
            }),
            prisma.equipment.groupBy({
                by: ['status'],
                where: {
                    gymId,
                    deletedAt: null,
                },
                _count: true,
            }),
            prisma.equipment.count({
                where: {
                    gymId,
                    deletedAt: null,
                    exercises: {
                        some: {
                            deletedAt: null,
                        },
                    },
                },
            }),
        ]);
        const statusCounts = byStatus.reduce((acc, item) => {
            acc[item.status] = item._count;
            return acc;
        }, {});
        return (0, response_1.successResponse)(res, {
            total,
            active: statusCounts.active || 0,
            maintenance: statusCounts.maintenance || 0,
            broken: statusCounts.broken || 0,
            withExercises,
            withoutExercises: total - withExercises,
        });
    }
    catch (error) {
        console.error('Get equipment stats error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to retrieve equipment statistics', 500);
    }
};
exports.getEquipmentStats = getEquipmentStats;
const getEquipmentByQR = async (req, res) => {
    try {
        const { gymId } = req.user;
        const { qrCodeUuid } = req.params;
        const equipment = await prisma.equipment.findFirst({
            where: {
                qrCodeUuid,
                gymId,
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                description: true,
                videoUrl: true,
                status: true,
            },
        });
        if (!equipment) {
            return (0, response_1.errorResponse)(res, 'Equipment not found', 404);
        }
        if (equipment.status === 'broken') {
            return (0, response_1.successResponse)(res, {
                ...equipment,
                warning: 'This equipment is currently out of service',
            });
        }
        if (equipment.status === 'maintenance') {
            return (0, response_1.successResponse)(res, {
                ...equipment,
                warning: 'This equipment is under maintenance',
            });
        }
        return (0, response_1.successResponse)(res, equipment);
    }
    catch (error) {
        console.error('Get equipment by QR error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to retrieve equipment', 500);
    }
};
exports.getEquipmentByQR = getEquipmentByQR;
const generateQRCode = async (req, res) => {
    try {
        const { gymId } = req.user;
        const { id } = req.params;
        const equipment = await prisma.equipment.findFirst({
            where: {
                id,
                gymId,
                deletedAt: null,
            },
            select: {
                qrCodeUuid: true,
                name: true,
            },
        });
        if (!equipment) {
            return (0, response_1.errorResponse)(res, 'Equipment not found', 404);
        }
        const qrCodeDataURL = await qrcode_1.default.toDataURL(equipment.qrCodeUuid, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            width: 300,
            margin: 2,
        });
        return (0, response_1.successResponse)(res, {
            equipmentId: id,
            equipmentName: equipment.name,
            qrCodeUuid: equipment.qrCodeUuid,
            qrCodeImage: qrCodeDataURL,
        });
    }
    catch (error) {
        console.error('Generate QR code error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to generate QR code', 500);
    }
};
exports.generateQRCode = generateQRCode;
//# sourceMappingURL=equipment.controller.js.map