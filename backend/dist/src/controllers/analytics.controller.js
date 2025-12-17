"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardSummary = exports.getActiveStudentsTrend = exports.getTopProducts = exports.getOrderStatusDistribution = exports.getRevenueTrend = void 0;
const client_1 = require("@prisma/client");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const prisma = new client_1.PrismaClient();
const getRevenueTrend = async (req, res, next) => {
    try {
        const { gymId } = req.user;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const orders = await prisma.order.findMany({
            where: {
                gymId,
                deletedAt: null,
                status: 'completed',
                createdAt: {
                    gte: thirtyDaysAgo,
                },
            },
            select: {
                createdAt: true,
                totalAmount: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
        const revenueByDate = orders.reduce((acc, order) => {
            const date = order.createdAt.toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = 0;
            }
            acc[date] += Number(order.totalAmount);
            return acc;
        }, {});
        const data = Object.keys(revenueByDate).map((date) => ({
            date,
            revenue: revenueByDate[date],
        }));
        (0, response_1.successResponse)(res, data, 'Revenue trend retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getRevenueTrend = getRevenueTrend;
const getOrderStatusDistribution = async (req, res, next) => {
    try {
        const { gymId } = req.user;
        const statusCounts = await prisma.order.groupBy({
            by: ['status'],
            where: {
                gymId,
                deletedAt: null,
            },
            _count: {
                id: true,
            },
        });
        const data = statusCounts.map((item) => ({
            status: item.status,
            count: item._count.id,
        }));
        (0, response_1.successResponse)(res, data, 'Order status distribution retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getOrderStatusDistribution = getOrderStatusDistribution;
const getTopProducts = async (req, res, next) => {
    try {
        const { gymId } = req.user;
        const limit = parseInt(req.query.limit) || 10;
        const orderItems = await prisma.orderItem.findMany({
            where: {
                order: {
                    gymId,
                    deletedAt: null,
                    status: 'completed',
                },
            },
            select: {
                productId: true,
                quantity: true,
                product: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        const productSales = orderItems.reduce((acc, item) => {
            if (!acc[item.productId]) {
                acc[item.productId] = {
                    productId: item.productId,
                    name: item.product.name,
                    totalSold: 0,
                };
            }
            acc[item.productId].totalSold += item.quantity;
            return acc;
        }, {});
        const data = Object.values(productSales)
            .sort((a, b) => b.totalSold - a.totalSold)
            .slice(0, limit);
        (0, response_1.successResponse)(res, data, 'Top products retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getTopProducts = getTopProducts;
const getActiveStudentsTrend = async (req, res, next) => {
    try {
        const { gymId, role } = req.user;
        if (role !== 'Trainer' && role !== 'GymOwner') {
            throw new errors_1.UnauthorizedError('Only trainers and gym owners can access this data');
        }
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const matches = await prisma.trainerMatch.findMany({
            where: {
                trainer: {
                    gymId,
                },
                deletedAt: null,
                createdAt: {
                    gte: thirtyDaysAgo,
                },
            },
            select: {
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const activeByDate = matches.reduce((acc, match) => {
            const date = match.createdAt.toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = { date, active: 0, inactive: 0 };
            }
            if (match.updatedAt >= sevenDaysAgo) {
                acc[date].active += 1;
            }
            else {
                acc[date].inactive += 1;
            }
            return acc;
        }, {});
        const data = Object.values(activeByDate);
        (0, response_1.successResponse)(res, data, 'Active students trend retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getActiveStudentsTrend = getActiveStudentsTrend;
const getDashboardSummary = async (req, res, next) => {
    try {
        const { gymId, role } = req.user;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const summary = {};
        const totalRevenue = await prisma.order.aggregate({
            where: {
                gymId,
                deletedAt: null,
                status: 'completed',
            },
            _sum: {
                totalAmount: true,
            },
        });
        summary.totalRevenue = Number(totalRevenue._sum.totalAmount || 0);
        const pendingOrders = await prisma.order.count({
            where: {
                gymId,
                deletedAt: null,
                status: 'pending_approval',
            },
        });
        summary.pendingOrders = pendingOrders;
        const totalProducts = await prisma.product.count({
            where: {
                gymId,
                deletedAt: null,
                isActive: true,
            },
        });
        summary.totalProducts = totalProducts;
        const lowStockProducts = await prisma.product.count({
            where: {
                gymId,
                deletedAt: null,
                isActive: true,
                stockQuantity: {
                    lt: 10,
                },
            },
        });
        summary.lowStockProducts = lowStockProducts;
        if (role === 'Trainer' || role === 'GymOwner') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const activeStudents = await prisma.trainerMatch.count({
                where: {
                    trainer: {
                        gymId,
                    },
                    deletedAt: null,
                    updatedAt: {
                        gte: sevenDaysAgo,
                    },
                },
            });
            summary.activeStudents = activeStudents;
        }
        const totalUsers = await prisma.user.count({
            where: {
                gymId,
                role: {
                    name: 'Student',
                },
            },
        });
        summary.totalUsers = totalUsers;
        (0, response_1.successResponse)(res, summary, 'Dashboard summary retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardSummary = getDashboardSummary;
//# sourceMappingURL=analytics.controller.js.map