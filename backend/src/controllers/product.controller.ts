import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '../utils/response';
import { deleteProductImage } from '../middleware/upload.middleware';

const prisma = new PrismaClient();

/**
 * Get all products with filtering
 */
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const search = req.query.search as string;
    const categoryId = req.query.categoryId as string;
    const isActive = req.query.isActive as string;
    const inStock = req.query.inStock as string;

    // Build where clause
    const where: any = {
      gymId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isActive === 'true') {
      where.isActive = true;
    } else if (isActive === 'false') {
      where.isActive = false;
    }

    if (inStock === 'true') {
      where.stockQuantity = { gt: 0 };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return successResponse(res, {
      items: products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get products error:', error);
    return errorResponse(res, 'Failed to retrieve products', 500);
  }
};

/**
 * Get single product by ID
 */
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        id,
        gymId,
        deletedAt: null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      return errorResponse(res, 'Product not found', 404);
    }

    return successResponse(res, product);
  } catch (error: any) {
    console.error('Get product by ID error:', error);
    return errorResponse(res, 'Failed to retrieve product', 500);
  }
};

/**
 * Create new product
 */
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { categoryId, name, description, imageUrl, price, stockQuantity, isActive } = req.body;

    // Verify category exists
    const category = await prisma.productCategory.findFirst({
      where: {
        id: categoryId,
        gymId,
        deletedAt: null,
      },
    });

    if (!category) {
      return errorResponse(res, 'Category not found', 404);
    }

    // Check for duplicate name in same category
    const existing = await prisma.product.findFirst({
      where: {
        name,
        categoryId,
        gymId,
        deletedAt: null,
      },
    });

    if (existing) {
      return errorResponse(res, 'Product with this name already exists in this category', 409);
    }

    const product = await prisma.product.create({
      data: {
        gymId,
        categoryId,
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        price,
        stockQuantity: stockQuantity || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return successResponse(res, product, 'Product created successfully', 201);
  } catch (error: any) {
    console.error('Create product error:', error);
    return errorResponse(res, 'Failed to create product', 500);
  }
};

/**
 * Update product
 */
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { id } = req.params;
    const { categoryId, name, description, imageUrl, price, stockQuantity, isActive } = req.body;

    // Verify product exists
    const existing = await prisma.product.findFirst({
      where: {
        id,
        gymId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return errorResponse(res, 'Product not found', 404);
    }

    // Verify category if being changed
    if (categoryId && categoryId !== existing.categoryId) {
      const category = await prisma.productCategory.findFirst({
        where: {
          id: categoryId,
          gymId,
          deletedAt: null,
        },
      });

      if (!category) {
        return errorResponse(res, 'Category not found', 404);
      }
    }

    // Check for duplicate name if name or category is being changed
    if ((name && name !== existing.name) || (categoryId && categoryId !== existing.categoryId)) {
      const duplicate = await prisma.product.findFirst({
        where: {
          name: name || existing.name,
          categoryId: categoryId || existing.categoryId,
          gymId,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (duplicate) {
        return errorResponse(res, 'Product with this name already exists in this category', 409);
      }
    }

    const updateData: any = {};
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (price !== undefined) updateData.price = price;
    if (stockQuantity !== undefined) updateData.stockQuantity = stockQuantity;
    if (isActive !== undefined) updateData.isActive = isActive;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return successResponse(res, product, 'Product updated successfully');
  } catch (error: any) {
    console.error('Update product error:', error);
    return errorResponse(res, 'Failed to update product', 500);
  }
};

/**
 * Delete product (soft delete)
 */
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { id } = req.params;

    // Verify product exists
    const existing = await prisma.product.findFirst({
      where: {
        id,
        gymId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return errorResponse(res, 'Product not found', 404);
    }

    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return successResponse(res, null, 'Product deleted successfully');
  } catch (error: any) {
    console.error('Delete product error:', error);
    return errorResponse(res, 'Failed to delete product', 500);
  }
};

/**
 * Update product stock
 */
export const updateStock = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { id } = req.params;
    const { stockQuantity } = req.body;

    // Verify product exists
    const existing = await prisma.product.findFirst({
      where: {
        id,
        gymId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return errorResponse(res, 'Product not found', 404);
    }

    const product = await prisma.product.update({
      where: { id },
      data: { stockQuantity },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return successResponse(res, product, 'Stock updated successfully');
  } catch (error: any) {
    console.error('Update stock error:', error);
    return errorResponse(res, 'Failed to update stock', 500);
  }
};

/**
 * Toggle product activation
 */
export const toggleActivation = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;
    const { id } = req.params;

    // Verify product exists
    const existing = await prisma.product.findFirst({
      where: {
        id,
        gymId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return errorResponse(res, 'Product not found', 404);
    }

    const product = await prisma.product.update({
      where: { id },
      data: { isActive: !existing.isActive },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return successResponse(
      res,
      product,
      `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`
    );
  } catch (error: any) {
    console.error('Toggle activation error:', error);
    return errorResponse(res, 'Failed to toggle product activation', 500);
  }
};

/**
 * Get product statistics
 */
export const getProductStats = async (req: Request, res: Response) => {
  try {
    const { gymId } = req.user!;

    const [total, active, inStock, outOfStock, totalValue] = await Promise.all([
      prisma.product.count({
        where: {
          gymId,
          deletedAt: null,
        },
      }),
      prisma.product.count({
        where: {
          gymId,
          isActive: true,
          deletedAt: null,
        },
      }),
      prisma.product.count({
        where: {
          gymId,
          stockQuantity: { gt: 0 },
          deletedAt: null,
        },
      }),
      prisma.product.count({
        where: {
          gymId,
          stockQuantity: 0,
          deletedAt: null,
        },
      }),
      prisma.product.aggregate({
        where: {
          gymId,
          deletedAt: null,
        },
        _sum: {
          stockQuantity: true,
        },
      }),
    ]);

    return successResponse(res, {
      total,
      active,
      inactive: total - active,
      inStock,
      outOfStock,
      totalStockItems: totalValue._sum.stockQuantity || 0,
    });
  } catch (error: any) {
    console.error('Get product stats error:', error);
    return errorResponse(res, 'Failed to retrieve product statistics', 500);
  }
};

/**
 * Upload product image
 * POST /api/products/:id/image
 */
export const uploadProductImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { gymId } = req.user!;

    // Check if file was uploaded
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400);
    }

    // Verify product exists and belongs to gym
    const product = await prisma.product.findFirst({
      where: { id, gymId, deletedAt: null },
    });

    if (!product) {
      return errorResponse(res, 'Product not found', 404);
    }

    // Delete old image if exists
    if (product.imageUrl) {
      deleteProductImage(product.imageUrl);
    }

    // Generate image URL
    const imageUrl = `/uploads/product-images/${req.file.filename}`;

    // Update product with new image URL
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { imageUrl },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return successResponse(res, updatedProduct, 'Product image uploaded successfully');
  } catch (error: any) {
    // If error occurs, delete the uploaded file
    if (req.file) {
      deleteProductImage(`/uploads/product-images/${req.file.filename}`);
    }
    console.error('Upload product image error:', error);
    return errorResponse(res, 'Failed to upload product image', 500);
  }
};
