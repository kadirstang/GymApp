import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '../utils/response';

const prisma = new PrismaClient();

/**
 * Get all product categories for a gym
 */
export const getCategories = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      prisma.productCategory.findMany({
        where: {
          gymId,
          deletedAt: null,
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      }),
      prisma.productCategory.count({
        where: {
          gymId,
          deletedAt: null,
        },
      }),
    ]);

    return successResponse(res, {
      categories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get categories error:', error);
    return errorResponse(res, 'Failed to retrieve categories', 500);
  }
};

/**
 * Get single category by ID
 */
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { id } = req.params;

    const category = await prisma.productCategory.findFirst({
      where: {
        id,
        gymId,
        deletedAt: null,
      },
      include: {
        products: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            price: true,
            stockQuantity: true,
            isActive: true,
          },
        },
      },
    });

    if (!category) {
      return errorResponse(res, 'Category not found', 404);
    }

    return successResponse(res, category);
  } catch (error: any) {
    console.error('Get category by ID error:', error);
    return errorResponse(res, 'Failed to retrieve category', 500);
  }
};

/**
 * Create new product category
 */
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { name, imageUrl } = req.body;

    // Check for duplicate name
    const existing = await prisma.productCategory.findFirst({
      where: {
        name,
        gymId,
        deletedAt: null,
      },
    });

    if (existing) {
      return errorResponse(res, 'Category with this name already exists', 409);
    }

    const category = await prisma.productCategory.create({
      data: {
        gymId,
        name,
        imageUrl: imageUrl || null,
      },
    });

    return successResponse(res, category, 'Category created successfully', 201);
  } catch (error: any) {
    console.error('Create category error:', error);
    return errorResponse(res, 'Failed to create category', 500);
  }
};

/**
 * Update product category
 */
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { id } = req.params;
    const { name, imageUrl } = req.body;

    // Verify category exists
    const existing = await prisma.productCategory.findFirst({
      where: {
        id,
        gymId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return errorResponse(res, 'Category not found', 404);
    }

    // Check for duplicate name if name is being changed
    if (name && name !== existing.name) {
      const duplicate = await prisma.productCategory.findFirst({
        where: {
          name,
          gymId,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (duplicate) {
        return errorResponse(res, 'Category with this name already exists', 409);
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    const category = await prisma.productCategory.update({
      where: { id },
      data: updateData,
    });

    return successResponse(res, category, 'Category updated successfully');
  } catch (error: any) {
    console.error('Update category error:', error);
    return errorResponse(res, 'Failed to update category', 500);
  }
};

/**
 * Delete product category (soft delete)
 */
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { id } = req.params;

    // Verify category exists
    const existing = await prisma.productCategory.findFirst({
      where: {
        id,
        gymId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return errorResponse(res, 'Category not found', 404);
    }

    // Check if category has active (non-deleted) products
    const activeProductsCount = await prisma.product.count({
      where: {
        categoryId: id,
        deletedAt: null,
      },
    });

    if (activeProductsCount > 0) {
      return errorResponse(
        res,
        `Cannot delete category with ${activeProductsCount} active product(s)`,
        400
      );
    }

    await prisma.productCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return successResponse(res, null, 'Category deleted successfully');
  } catch (error: any) {
    console.error('Delete category error:', error);
    return errorResponse(res, 'Failed to delete category', 500);
  }
};
