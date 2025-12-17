import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse } from '../utils/response';
import { UnauthorizedError } from '../utils/errors';

const prisma = new PrismaClient();

/**
 * Get revenue trend for last 30 days
 * GET /api/analytics/revenue-trend
 */
export const getRevenueTrend = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { gymId } = req.user!;

    // Get last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get orders grouped by date
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

    // Group by date and sum revenue
    const revenueByDate = orders.reduce((acc: any, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += Number(order.totalAmount);
      return acc;
    }, {});

    // Convert to array format for charts
    const data = Object.keys(revenueByDate).map((date) => ({
      date,
      revenue: revenueByDate[date],
    }));

    successResponse(res, data, 'Revenue trend retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get order status distribution
 * GET /api/analytics/order-status
 */
export const getOrderStatusDistribution = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { gymId } = req.user!;

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

    successResponse(res, data, 'Order status distribution retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get top selling products
 * GET /api/analytics/top-products
 */
export const getTopProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { gymId } = req.user!;
    const limit = parseInt(req.query.limit as string) || 10;

    // Get order items grouped by product
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

    // Group by product and sum quantities
    const productSales = orderItems.reduce((acc: any, item) => {
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

    // Convert to array and sort by totalSold
    const data = Object.values(productSales)
      .sort((a: any, b: any) => b.totalSold - a.totalSold)
      .slice(0, limit);

    successResponse(res, data, 'Top products retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get active students trend (last 30 days)
 * GET /api/analytics/active-students
 */
export const getActiveStudentsTrend = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { gymId, role } = req.user!;

    // Only trainers can access this
    if (role !== 'Trainer' && role !== 'GymOwner') {
      throw new UnauthorizedError('Only trainers and gym owners can access this data');
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get trainer matches created in last 30 days
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

    // Group by date and count active students (active if updated in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeByDate = matches.reduce((acc: any, match) => {
      const date = match.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, active: 0, inactive: 0 };
      }
      // Check if updated in last 7 days (active logic)
      if (match.updatedAt >= sevenDaysAgo) {
        acc[date].active += 1;
      } else {
        acc[date].inactive += 1;
      }
      return acc;
    }, {});

    const data = Object.values(activeByDate);

    successResponse(res, data, 'Active students trend retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get dashboard summary stats
 * GET /api/analytics/summary
 */
export const getDashboardSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { gymId, role } = req.user!;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const summary: any = {};

    // Total revenue (completed orders)
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

    // Pending orders count
    const pendingOrders = await prisma.order.count({
      where: {
        gymId,
        deletedAt: null,
        status: 'pending_approval',
      },
    });
    summary.pendingOrders = pendingOrders;

    // Total products
    const totalProducts = await prisma.product.count({
      where: {
        gymId,
        deletedAt: null,
        isActive: true,
      },
    });
    summary.totalProducts = totalProducts;

    // Low stock products (< 10)
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

    // Active students (for trainers/owners)
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

    // Total users
    const totalUsers = await prisma.user.count({
      where: {
        gymId,
        role: {
          name: 'Student',
        },
      },
    });
    summary.totalUsers = totalUsers;

    successResponse(res, summary, 'Dashboard summary retrieved successfully');
  } catch (error) {
    next(error);
  }
};
