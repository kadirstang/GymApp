import express from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { handleValidationErrors } from '../middleware/validation.middleware';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  toggleActivation,
  getProductStats,
} from '../controllers/product.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/products/stats
 * @desc    Get product statistics
 * @access  Private (products.read)
 */
router.get(
  '/stats',
  requirePermission('products.read'),
  getProductStats
);

/**
 * @route   GET /api/products
 * @desc    Get all products with filtering
 * @access  Private (products.read)
 */
router.get(
  '/',
  requirePermission('products.read'),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('search')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Search must be at most 100 characters'),
    query('categoryId')
      .optional()
      .isUUID()
      .withMessage('Category ID must be a valid UUID'),
    query('isActive')
      .optional()
      .isIn(['true', 'false'])
      .withMessage('isActive must be true or false'),
    query('inStock')
      .optional()
      .isIn(['true', 'false'])
      .withMessage('inStock must be true or false'),
    handleValidationErrors,
  ],
  getProducts
);

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 * @access  Private (products.read)
 */
router.get(
  '/:id',
  requirePermission('products.read'),
  [
    param('id')
      .isUUID()
      .withMessage('Product ID must be a valid UUID'),
    handleValidationErrors,
  ],
  getProductById
);

/**
 * @route   POST /api/products
 * @desc    Create new product
 * @access  Private (products.create)
 */
router.post(
  '/',
  requirePermission('products.create'),
  [
    body('categoryId')
      .isUUID()
      .withMessage('Category ID must be a valid UUID'),
    body('name')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 200 })
      .withMessage('Name must be at most 200 characters'),
    body('description')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must be at most 2000 characters'),
    body('imageUrl')
      .optional()
      .isString()
      .trim()
      .isURL()
      .withMessage('Image URL must be a valid URL'),
    body('price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('stockQuantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock quantity must be a non-negative integer'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    handleValidationErrors,
  ],
  createProduct
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private (products.update)
 */
router.put(
  '/:id',
  requirePermission('products.update'),
  [
    param('id')
      .isUUID()
      .withMessage('Product ID must be a valid UUID'),
    body('categoryId')
      .optional()
      .isUUID()
      .withMessage('Category ID must be a valid UUID'),
    body('name')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Name cannot be empty')
      .isLength({ max: 200 })
      .withMessage('Name must be at most 200 characters'),
    body('description')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must be at most 2000 characters'),
    body('imageUrl')
      .optional()
      .isString()
      .trim()
      .isURL()
      .withMessage('Image URL must be a valid URL'),
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('stockQuantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock quantity must be a non-negative integer'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    handleValidationErrors,
  ],
  updateProduct
);

/**
 * @route   PATCH /api/products/:id/stock
 * @desc    Update product stock quantity
 * @access  Private (products.update)
 */
router.patch(
  '/:id/stock',
  requirePermission('products.update'),
  [
    param('id')
      .isUUID()
      .withMessage('Product ID must be a valid UUID'),
    body('stockQuantity')
      .isInt({ min: 0 })
      .withMessage('Stock quantity must be a non-negative integer'),
    handleValidationErrors,
  ],
  updateStock
);

/**
 * @route   PATCH /api/products/:id/toggle
 * @desc    Toggle product activation status
 * @access  Private (products.update)
 */
router.patch(
  '/:id/toggle',
  requirePermission('products.update'),
  [
    param('id')
      .isUUID()
      .withMessage('Product ID must be a valid UUID'),
    handleValidationErrors,
  ],
  toggleActivation
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product (soft delete)
 * @access  Private (products.delete)
 */
router.delete(
  '/:id',
  requirePermission('products.delete'),
  [
    param('id')
      .isUUID()
      .withMessage('Product ID must be a valid UUID'),
    handleValidationErrors,
  ],
  deleteProduct
);

export default router;
