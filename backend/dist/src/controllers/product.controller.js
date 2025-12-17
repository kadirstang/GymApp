"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProductImage = exports.getProductStats = exports.toggleActivation = exports.updateStock = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getProducts = void 0;
const client_1 = require("@prisma/client");
const response_1 = require("../utils/response");
const upload_middleware_1 = require("../middleware/upload.middleware");
const prisma = new client_1.PrismaClient();
const getProducts = async (req, res) => {
    try {
        const { gymId } = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const search = req.query.search;
        const categoryId = req.query.categoryId;
        const isActive = req.query.isActive;
        const inStock = req.query.inStock;
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
        if (categoryId) {
            where.categoryId = categoryId;
        }
        if (isActive === 'true') {
            where.isActive = true;
        }
        else if (isActive === 'false') {
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
        return (0, response_1.successResponse)(res, {
            items: products,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error('Get products error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to retrieve products', 500);
    }
};
exports.getProducts = getProducts;
const getProductById = async (req, res) => {
    try {
        const { gymId } = req.user;
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
            return (0, response_1.errorResponse)(res, 'Product not found', 404);
        }
        return (0, response_1.successResponse)(res, product);
    }
    catch (error) {
        console.error('Get product by ID error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to retrieve product', 500);
    }
};
exports.getProductById = getProductById;
const createProduct = async (req, res) => {
    try {
        const { gymId } = req.user;
        const { categoryId, name, description, imageUrl, price, stockQuantity, isActive } = req.body;
        const category = await prisma.productCategory.findFirst({
            where: {
                id: categoryId,
                gymId,
                deletedAt: null,
            },
        });
        if (!category) {
            return (0, response_1.errorResponse)(res, 'Category not found', 404);
        }
        const existing = await prisma.product.findFirst({
            where: {
                name,
                categoryId,
                gymId,
                deletedAt: null,
            },
        });
        if (existing) {
            return (0, response_1.errorResponse)(res, 'Product with this name already exists in this category', 409);
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
        return (0, response_1.successResponse)(res, product, 'Product created successfully', 201);
    }
    catch (error) {
        console.error('Create product error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to create product', 500);
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        const { gymId } = req.user;
        const { id } = req.params;
        const { categoryId, name, description, imageUrl, price, stockQuantity, isActive } = req.body;
        const existing = await prisma.product.findFirst({
            where: {
                id,
                gymId,
                deletedAt: null,
            },
        });
        if (!existing) {
            return (0, response_1.errorResponse)(res, 'Product not found', 404);
        }
        if (categoryId && categoryId !== existing.categoryId) {
            const category = await prisma.productCategory.findFirst({
                where: {
                    id: categoryId,
                    gymId,
                    deletedAt: null,
                },
            });
            if (!category) {
                return (0, response_1.errorResponse)(res, 'Category not found', 404);
            }
        }
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
                return (0, response_1.errorResponse)(res, 'Product with this name already exists in this category', 409);
            }
        }
        const updateData = {};
        if (categoryId !== undefined)
            updateData.categoryId = categoryId;
        if (name !== undefined)
            updateData.name = name;
        if (description !== undefined)
            updateData.description = description;
        if (imageUrl !== undefined)
            updateData.imageUrl = imageUrl;
        if (price !== undefined)
            updateData.price = price;
        if (stockQuantity !== undefined)
            updateData.stockQuantity = stockQuantity;
        if (isActive !== undefined)
            updateData.isActive = isActive;
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
        return (0, response_1.successResponse)(res, product, 'Product updated successfully');
    }
    catch (error) {
        console.error('Update product error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to update product', 500);
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const { gymId } = req.user;
        const { id } = req.params;
        const existing = await prisma.product.findFirst({
            where: {
                id,
                gymId,
                deletedAt: null,
            },
        });
        if (!existing) {
            return (0, response_1.errorResponse)(res, 'Product not found', 404);
        }
        await prisma.product.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return (0, response_1.successResponse)(res, null, 'Product deleted successfully');
    }
    catch (error) {
        console.error('Delete product error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to delete product', 500);
    }
};
exports.deleteProduct = deleteProduct;
const updateStock = async (req, res) => {
    try {
        const { gymId } = req.user;
        const { id } = req.params;
        const { stockQuantity } = req.body;
        const existing = await prisma.product.findFirst({
            where: {
                id,
                gymId,
                deletedAt: null,
            },
        });
        if (!existing) {
            return (0, response_1.errorResponse)(res, 'Product not found', 404);
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
        return (0, response_1.successResponse)(res, product, 'Stock updated successfully');
    }
    catch (error) {
        console.error('Update stock error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to update stock', 500);
    }
};
exports.updateStock = updateStock;
const toggleActivation = async (req, res) => {
    try {
        const { gymId } = req.user;
        const { id } = req.params;
        const existing = await prisma.product.findFirst({
            where: {
                id,
                gymId,
                deletedAt: null,
            },
        });
        if (!existing) {
            return (0, response_1.errorResponse)(res, 'Product not found', 404);
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
        return (0, response_1.successResponse)(res, product, `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`);
    }
    catch (error) {
        console.error('Toggle activation error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to toggle product activation', 500);
    }
};
exports.toggleActivation = toggleActivation;
const getProductStats = async (req, res) => {
    try {
        const { gymId } = req.user;
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
        return (0, response_1.successResponse)(res, {
            total,
            active,
            inactive: total - active,
            inStock,
            outOfStock,
            totalStockItems: totalValue._sum.stockQuantity || 0,
        });
    }
    catch (error) {
        console.error('Get product stats error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to retrieve product statistics', 500);
    }
};
exports.getProductStats = getProductStats;
const uploadProductImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { gymId } = req.user;
        if (!req.file) {
            return (0, response_1.errorResponse)(res, 'No file uploaded', 400);
        }
        const product = await prisma.product.findFirst({
            where: { id, gymId, deletedAt: null },
        });
        if (!product) {
            return (0, response_1.errorResponse)(res, 'Product not found', 404);
        }
        if (product.imageUrl) {
            (0, upload_middleware_1.deleteProductImage)(product.imageUrl);
        }
        const imageUrl = `/uploads/product-images/${req.file.filename}`;
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
        return (0, response_1.successResponse)(res, updatedProduct, 'Product image uploaded successfully');
    }
    catch (error) {
        if (req.file) {
            (0, upload_middleware_1.deleteProductImage)(`/uploads/product-images/${req.file.filename}`);
        }
        console.error('Upload product image error:', error);
        return (0, response_1.errorResponse)(res, 'Failed to upload product image', 500);
    }
};
exports.uploadProductImage = uploadProductImage;
//# sourceMappingURL=product.controller.js.map