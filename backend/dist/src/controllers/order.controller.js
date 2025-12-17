"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderStats = exports.deleteOrder = exports.updateOrderStatus = exports.getOrderById = exports.getOrders = exports.createOrder = void 0;
const client_1 = require("@prisma/client");
const response_js_1 = require("../utils/response.js");
const prisma = new client_1.PrismaClient();
const generateOrderNumber = async (gymId) => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;
    const lastOrder = await prisma.order.findFirst({
        where: {
            gymId,
            orderNumber: {
                startsWith: `ORD-${datePrefix}`,
            },
        },
        orderBy: {
            orderNumber: 'desc',
        },
    });
    let sequence = 1;
    if (lastOrder) {
        const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
        sequence = lastSequence + 1;
    }
    return `ORD-${datePrefix}-${String(sequence).padStart(5, '0')}`;
};
const createOrder = async (req, res) => {
    try {
        const { gymId, userId, role } = req.user;
        const { items, metadata } = req.body;
        const targetUserId = req.body.userId || userId;
        if (role === 'Student' && targetUserId !== userId) {
            return (0, response_js_1.errorResponse)(res, 'Students can only create orders for themselves', 403);
        }
        if (targetUserId !== userId) {
            const targetUser = await prisma.user.findFirst({
                where: {
                    id: targetUserId,
                    gymId,
                    deletedAt: null,
                },
            });
            if (!targetUser) {
                return (0, response_js_1.errorResponse)(res, 'Target user not found', 404);
            }
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return (0, response_js_1.errorResponse)(res, 'Order must contain at least one item', 400);
        }
        const productIds = items.map((item) => item.productId);
        const uniqueProductIds = [...new Set(productIds)];
        const products = await prisma.product.findMany({
            where: {
                id: { in: uniqueProductIds },
                gymId,
                deletedAt: null,
                isActive: true,
            },
        });
        if (products.length !== uniqueProductIds.length) {
            return (0, response_js_1.errorResponse)(res, 'One or more products not found or inactive', 400);
        }
        let totalAmount = new client_1.Prisma.Decimal(0);
        const orderItemsData = [];
        const productQuantities = new Map();
        for (const item of items) {
            const product = products.find((p) => p.id === item.productId);
            if (!product) {
                return (0, response_js_1.errorResponse)(res, `Product ${item.productId} not found`, 400);
            }
            if (item.quantity <= 0) {
                return (0, response_js_1.errorResponse)(res, 'Quantity must be greater than 0', 400);
            }
            const currentTotal = productQuantities.get(item.productId) || 0;
            productQuantities.set(item.productId, currentTotal + item.quantity);
            const itemTotal = product.price.mul(item.quantity);
            totalAmount = totalAmount.add(itemTotal);
            orderItemsData.push({
                productId: product.id,
                quantity: item.quantity,
                unitPrice: product.price,
            });
        }
        for (const [productId, totalQuantity] of productQuantities) {
            const product = products.find((p) => p.id === productId);
            if (product && product.stockQuantity < totalQuantity) {
                return (0, response_js_1.errorResponse)(res, `Insufficient stock for ${product.name}. Requested: ${totalQuantity}, Available: ${product.stockQuantity}`, 400);
            }
        }
        const orderNumber = await generateOrderNumber(gymId);
        const order = await prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    gymId,
                    userId: targetUserId,
                    orderNumber,
                    totalAmount,
                    status: 'pending_approval',
                    metadata: metadata || null,
                    items: {
                        create: orderItemsData,
                    },
                },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    imageUrl: true,
                                },
                            },
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });
            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stockQuantity: {
                            decrement: item.quantity,
                        },
                    },
                });
            }
            return newOrder;
        });
        return (0, response_js_1.successResponse)(res, order, 'Order created successfully', 201);
    }
    catch (error) {
        console.error('Create order error:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to create order', 500);
    }
};
exports.createOrder = createOrder;
const getOrders = async (req, res) => {
    try {
        const { gymId, userId, role } = req.user;
        const { page = 1, limit = 20, status, userId: filterUserId, search, } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const where = {
            gymId,
            deletedAt: null,
        };
        if (role === 'Student') {
            where.userId = userId;
        }
        else if (role.name === 'Trainer') {
            const trainerMatches = await prisma.trainerMatch.findMany({
                where: {
                    trainerId: userId,
                    status: 'active',
                    deletedAt: null,
                },
                select: { studentId: true },
            });
            const studentIds = trainerMatches.map(m => m.studentId);
            if (filterUserId) {
                if (!studentIds.includes(filterUserId)) {
                    return (0, response_js_1.errorResponse)(res, 'You can only view orders of your students', 403);
                }
                where.userId = filterUserId;
            }
            else {
                where.userId = { in: studentIds };
            }
        }
        else {
            if (filterUserId) {
                where.userId = filterUserId;
            }
        }
        if (status) {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                {
                    user: {
                        OR: [
                            { firstName: { contains: search, mode: 'insensitive' } },
                            { lastName: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } },
                        ],
                    },
                },
            ];
        }
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    items: {
                        where: { deletedAt: null },
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    imageUrl: true,
                                },
                            },
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.order.count({ where }),
        ]);
        return (0, response_js_1.successResponse)(res, {
            items: orders,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        console.error('Get orders error:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to retrieve orders', 500);
    }
};
exports.getOrders = getOrders;
const getOrderById = async (req, res) => {
    try {
        const { gymId, userId, role } = req.user;
        const { id } = req.params;
        const where = {
            id,
            gymId,
            deletedAt: null,
        };
        if (role === 'Student') {
            where.userId = userId;
        }
        const order = await prisma.order.findFirst({
            where,
            include: {
                items: {
                    where: { deletedAt: null },
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                imageUrl: true,
                                categoryId: true,
                            },
                        },
                    },
                },
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });
        if (!order) {
            return (0, response_js_1.errorResponse)(res, 'Order not found', 404);
        }
        return (0, response_js_1.successResponse)(res, order);
    }
    catch (error) {
        console.error('Get order by ID error:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to retrieve order', 500);
    }
};
exports.getOrderById = getOrderById;
const updateOrderStatus = async (req, res) => {
    try {
        const { gymId, role } = req.user;
        const { id } = req.params;
        const { status, metadata } = req.body;
        if (role === 'Student') {
            return (0, response_js_1.errorResponse)(res, 'Students cannot update order status', 403);
        }
        const validStatuses = ['pending_approval', 'prepared', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return (0, response_js_1.errorResponse)(res, `Status must be one of: ${validStatuses.join(', ')}`, 400);
        }
        const existing = await prisma.order.findFirst({
            where: {
                id,
                gymId,
                deletedAt: null,
            },
            include: {
                items: {
                    where: { deletedAt: null },
                    select: {
                        productId: true,
                        quantity: true,
                    },
                },
            },
        });
        if (!existing) {
            return (0, response_js_1.errorResponse)(res, 'Order not found', 404);
        }
        if (status === 'cancelled' && existing.status !== 'cancelled') {
            await prisma.$transaction(async (tx) => {
                await tx.order.update({
                    where: { id },
                    data: {
                        status,
                        metadata: metadata || existing.metadata,
                    },
                });
                for (const item of existing.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stockQuantity: {
                                increment: item.quantity,
                            },
                        },
                    });
                }
            });
        }
        else {
            await prisma.order.update({
                where: { id },
                data: {
                    status,
                    metadata: metadata !== undefined ? metadata : existing.metadata,
                },
            });
        }
        const updatedOrder = await prisma.order.findFirst({
            where: { id },
            include: {
                items: {
                    where: { deletedAt: null },
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                imageUrl: true,
                            },
                        },
                    },
                },
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
        return (0, response_js_1.successResponse)(res, updatedOrder, 'Order status updated successfully');
    }
    catch (error) {
        console.error('Update order status error:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to update order status', 500);
    }
};
exports.updateOrderStatus = updateOrderStatus;
const deleteOrder = async (req, res) => {
    try {
        const { gymId, userId, role } = req.user;
        const { id } = req.params;
        const where = {
            id,
            gymId,
            deletedAt: null,
        };
        if (role === 'Student') {
            where.userId = userId;
            where.status = 'pending_approval';
        }
        const existing = await prisma.order.findFirst({
            where,
            include: {
                items: {
                    where: { deletedAt: null },
                    select: {
                        productId: true,
                        quantity: true,
                    },
                },
            },
        });
        if (!existing) {
            if (role === 'Student') {
                return (0, response_js_1.errorResponse)(res, 'Order not found or cannot be cancelled', 404);
            }
            return (0, response_js_1.errorResponse)(res, 'Order not found', 404);
        }
        if (existing.status === 'completed') {
            return (0, response_js_1.errorResponse)(res, 'Cannot delete completed orders', 400);
        }
        await prisma.$transaction(async (tx) => {
            await tx.order.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    status: 'cancelled',
                },
            });
            if (existing.status !== 'cancelled') {
                for (const item of existing.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stockQuantity: {
                                increment: item.quantity,
                            },
                        },
                    });
                }
            }
        });
        return (0, response_js_1.successResponse)(res, null, 'Order cancelled successfully');
    }
    catch (error) {
        console.error('Delete order error:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to cancel order', 500);
    }
};
exports.deleteOrder = deleteOrder;
const getOrderStats = async (req, res) => {
    try {
        const { gymId, userId, role } = req.user;
        const where = {
            gymId,
            deletedAt: null,
        };
        if (role === 'Student') {
            where.userId = userId;
        }
        const [totalOrders, pendingOrders, preparedOrders, completedOrders, cancelledOrders, totalRevenue,] = await Promise.all([
            prisma.order.count({ where }),
            prisma.order.count({ where: { ...where, status: 'pending_approval' } }),
            prisma.order.count({ where: { ...where, status: 'prepared' } }),
            prisma.order.count({ where: { ...where, status: 'completed' } }),
            prisma.order.count({ where: { ...where, status: 'cancelled' } }),
            prisma.order.aggregate({
                where: { ...where, status: { in: ['completed'] } },
                _sum: { totalAmount: true },
            }),
        ]);
        return (0, response_js_1.successResponse)(res, {
            totalOrders,
            byStatus: {
                pending: pendingOrders,
                prepared: preparedOrders,
                completed: completedOrders,
                cancelled: cancelledOrders,
            },
            totalRevenue: totalRevenue._sum.totalAmount || 0,
        });
    }
    catch (error) {
        console.error('Get order stats error:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to retrieve order statistics', 500);
    }
};
exports.getOrderStats = getOrderStats;
//# sourceMappingURL=order.controller.js.map