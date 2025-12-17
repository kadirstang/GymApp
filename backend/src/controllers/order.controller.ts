import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { successResponse, errorResponse } from '../utils/response.js';

const prisma = new PrismaClient();

/**
 * Generate unique order number
 * Format: ORD-YYYYMMDD-XXXXX
 */
const generateOrderNumber = async (gymId: string): Promise<string> => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;

  // Find the last order for today in this gym
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

/**
 * @route   POST /api/orders
 * @desc    Create new order with items
 * @access  Private (orders.create)
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { gymId, userId, role } = req.user!;
    const { items, metadata } = req.body;

    // Students can only create orders for themselves
    // Trainers/Owners can create orders for any user
    const targetUserId = req.body.userId || userId;

    if (role === 'Student' && targetUserId !== userId) {
      return errorResponse(res, 'Students can only create orders for themselves', 403);
    }

    // Verify target user exists and belongs to same gym
    if (targetUserId !== userId) {
      const targetUser = await prisma.user.findFirst({
        where: {
          id: targetUserId,
          gymId,
          deletedAt: null,
        },
      });

      if (!targetUser) {
        return errorResponse(res, 'Target user not found', 404);
      }
    }

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return errorResponse(res, 'Order must contain at least one item', 400);
    }

    // Fetch all products and validate
    const productIds = items.map((item: any) => item.productId);
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
      return errorResponse(res, 'One or more products not found or inactive', 400);
    }

    // Check stock and calculate total
    let totalAmount = new Prisma.Decimal(0);
    const orderItemsData: any[] = [];
    const productQuantities = new Map<string, number>(); // Track total quantity per product

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return errorResponse(res, `Product ${item.productId} not found`, 400);
      }

      if (item.quantity <= 0) {
        return errorResponse(res, 'Quantity must be greater than 0', 400);
      }

      // Track total quantity for this product across all items
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

    // Validate stock for all products
    for (const [productId, totalQuantity] of productQuantities) {
      const product = products.find((p) => p.id === productId);
      if (product && product.stockQuantity < totalQuantity) {
        return errorResponse(
          res,
          `Insufficient stock for ${product.name}. Requested: ${totalQuantity}, Available: ${product.stockQuantity}`,
          400
        );
      }
    }

    // Generate order number
    const orderNumber = await generateOrderNumber(gymId);

    // Create order with items in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
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
                  category: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
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

      // Reserve stock (decrement)
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

    return successResponse(res, order, 'Order created successfully', 201);
  } catch (error: any) {
    console.error('Create order error:', error);
    return errorResponse(res, 'Failed to create order', 500);
  }
};

/**
 * @route   GET /api/orders
 * @desc    Get all orders (with filters)
 * @access  Private (orders.read)
 */
export const getOrders = async (req: Request, res: Response) => {
  try {
    const { gymId, userId, role } = req.user!;
    const {
      page = 1,
      limit = 20,
      status,
      userId: filterUserId,
      search,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      gymId,
      deletedAt: null,
    };

    // Role-based filtering
    if (role === 'Student') {
      // Students can only see their own orders
      where.userId = userId;
    } else if (role.name === 'Trainer') {
      // Trainers can only see their students' orders
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
        if (!studentIds.includes(filterUserId as string)) {
          return errorResponse(res, 'You can only view orders of your students', 403);
        }
        where.userId = filterUserId;
      } else {
        where.userId = { in: studentIds };
      }
    } else {
      // GymOwner can see all orders
      if (filterUserId) {
        where.userId = filterUserId;
      }
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { firstName: { contains: search as string, mode: 'insensitive' } },
              { lastName: { contains: search as string, mode: 'insensitive' } },
              { email: { contains: search as string, mode: 'insensitive' } },
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
                  category: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
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

    return successResponse(res, {
      items: orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get orders error:', error);
    return errorResponse(res, 'Failed to retrieve orders', 500);
  }
};

/**
 * @route   GET /api/orders/:id
 * @desc    Get single order by ID
 * @access  Private (orders.read)
 */
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { gymId, userId, role } = req.user!;
    const { id } = req.params;

    const where: any = {
      id,
      gymId,
      deletedAt: null,
    };

    // Students can only see their own orders
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
      return errorResponse(res, 'Order not found', 404);
    }

    return successResponse(res, order);
  } catch (error: any) {
    console.error('Get order by ID error:', error);
    return errorResponse(res, 'Failed to retrieve order', 500);
  }
};

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status
 * @access  Private (orders.update)
 */
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { gymId, role } = req.user!;
    const { id } = req.params;
    const { status, metadata } = req.body;

    // Only trainers and owners can update order status
    if (role === 'Student') {
      return errorResponse(res, 'Students cannot update order status', 403);
    }

    const validStatuses = ['pending_approval', 'prepared', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, `Status must be one of: ${validStatuses.join(', ')}`, 400);
    }

    // Verify order exists
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
      return errorResponse(res, 'Order not found', 404);
    }

    // If cancelling order, restore stock
    if (status === 'cancelled' && existing.status !== 'cancelled') {
      await prisma.$transaction(async (tx) => {
        // Update order status with metadata
        await tx.order.update({
          where: { id },
          data: {
            status,
            metadata: metadata || existing.metadata,
          },
        });

        // Restore stock for each item
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
    } else {
      // Update status and metadata
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

    return successResponse(res, updatedOrder, 'Order status updated successfully');
  } catch (error: any) {
    console.error('Update order status error:', error);
    return errorResponse(res, 'Failed to update order status', 500);
  }
};

/**
 * @route   DELETE /api/orders/:id
 * @desc    Cancel/Delete order (soft delete)
 * @access  Private (orders.delete)
 */
export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { gymId, userId, role } = req.user!;
    const { id } = req.params;

    const where: any = {
      id,
      gymId,
      deletedAt: null,
    };

    // Students can only delete their own pending orders
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
        return errorResponse(res, 'Order not found or cannot be cancelled', 404);
      }
      return errorResponse(res, 'Order not found', 404);
    }

    // Cannot delete completed orders
    if (existing.status === 'completed') {
      return errorResponse(res, 'Cannot delete completed orders', 400);
    }

    // Soft delete order and restore stock in transaction
    await prisma.$transaction(async (tx) => {
      // Soft delete order
      await tx.order.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: 'cancelled',
        },
      });

      // Restore stock if order wasn't already cancelled
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

    return successResponse(res, null, 'Order cancelled successfully');
  } catch (error: any) {
    console.error('Delete order error:', error);
    return errorResponse(res, 'Failed to cancel order', 500);
  }
};

/**
 * @route   GET /api/orders/stats
 * @desc    Get order statistics
 * @access  Private (orders.read)
 */
export const getOrderStats = async (req: Request, res: Response) => {
  try {
    const { gymId, userId, role } = req.user!;

    const where: any = {
      gymId,
      deletedAt: null,
    };

    // Students only see their own stats
    if (role === 'Student') {
      where.userId = userId;
    }

    const [
      totalOrders,
      pendingOrders,
      preparedOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
    ] = await Promise.all([
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

    return successResponse(res, {
      totalOrders,
      byStatus: {
        pending: pendingOrders,
        prepared: preparedOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
      },
      totalRevenue: totalRevenue._sum.totalAmount || 0,
    });
  } catch (error: any) {
    console.error('Get order stats error:', error);
    return errorResponse(res, 'Failed to retrieve order statistics', 500);
  }
};
