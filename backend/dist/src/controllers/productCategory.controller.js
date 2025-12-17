"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategoryById = exports.getCategories = void 0;
const client_1 = require("@prisma/client");
const response_1 = require("../utils/response");
const prisma = new client_1.PrismaClient();
const getCategories = async (req, res) => {
    try {
        const { gymId } = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
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
        return (0, response_1.successResponse)(res, {
            items: categories,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error('Get categories error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to retrieve categories', 500);
    }
};
exports.getCategories = getCategories;
const getCategoryById = async (req, res) => {
    try {
        const { gymId } = req.user;
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
            return (0, response_1.errorResponse)(res, 'Category not found', 404);
        }
        return (0, response_1.successResponse)(res, category);
    }
    catch (error) {
        console.error('Get category by ID error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to retrieve category', 500);
    }
};
exports.getCategoryById = getCategoryById;
const createCategory = async (req, res) => {
    try {
        const { gymId } = req.user;
        const { name, imageUrl } = req.body;
        const existing = await prisma.productCategory.findFirst({
            where: {
                name,
                gymId,
                deletedAt: null,
            },
        });
        if (existing) {
            return (0, response_1.errorResponse)(res, 'Category with this name already exists', 409);
        }
        const category = await prisma.productCategory.create({
            data: {
                gymId,
                name,
                imageUrl: imageUrl || null,
            },
        });
        return (0, response_1.successResponse)(res, category, 'Category created successfully', 201);
    }
    catch (error) {
        console.error('Create category error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to create category', 500);
    }
};
exports.createCategory = createCategory;
const updateCategory = async (req, res) => {
    try {
        const { gymId } = req.user;
        const { id } = req.params;
        const { name, imageUrl } = req.body;
        const existing = await prisma.productCategory.findFirst({
            where: {
                id,
                gymId,
                deletedAt: null,
            },
        });
        if (!existing) {
            return (0, response_1.errorResponse)(res, 'Category not found', 404);
        }
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
                return (0, response_1.errorResponse)(res, 'Category with this name already exists', 409);
            }
        }
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (imageUrl !== undefined)
            updateData.imageUrl = imageUrl;
        const category = await prisma.productCategory.update({
            where: { id },
            data: updateData,
        });
        return (0, response_1.successResponse)(res, category, 'Category updated successfully');
    }
    catch (error) {
        console.error('Update category error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to update category', 500);
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    try {
        const { gymId } = req.user;
        const { id } = req.params;
        const existing = await prisma.productCategory.findFirst({
            where: {
                id,
                gymId,
                deletedAt: null,
            },
        });
        if (!existing) {
            return (0, response_1.errorResponse)(res, 'Category not found', 404);
        }
        const activeProductsCount = await prisma.product.count({
            where: {
                categoryId: id,
                deletedAt: null,
            },
        });
        if (activeProductsCount > 0) {
            return (0, response_1.errorResponse)(res, `Cannot delete category with ${activeProductsCount} active product(s)`, 400);
        }
        await prisma.productCategory.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return (0, response_1.successResponse)(res, null, 'Category deleted successfully');
    }
    catch (error) {
        console.error('Delete category error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to delete category', 500);
    }
};
exports.deleteCategory = deleteCategory;
//# sourceMappingURL=productCategory.controller.js.map