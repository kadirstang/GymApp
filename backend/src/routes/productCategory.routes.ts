import express from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { handleValidationErrors } from '../middleware/validation.middleware';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/productCategory.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/product-categories
 * @desc    Get all product categories
 * @access  Private (productCategories.read)
 */
router.get(
  '/',
  requirePermission('productCategories.read'),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors,
  ],
  getCategories
);

/**
 * @route   GET /api/product-categories/:id
 * @desc    Get single category by ID
 * @access  Private (productCategories.read)
 */
router.get(
  '/:id',
  requirePermission('productCategories.read'),
  [
    param('id')
      .isUUID()
      .withMessage('Category ID must be a valid UUID'),
    handleValidationErrors,
  ],
  getCategoryById
);

/**
 * @route   POST /api/product-categories
 * @desc    Create new product category
 * @access  Private (productCategories.create)
 */
router.post(
  '/',
  requirePermission('productCategories.create'),
  [
    body('name')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 100 })
      .withMessage('Name must be at most 100 characters'),
    body('imageUrl')
      .optional()
      .isString()
      .trim()
      .isURL()
      .withMessage('Image URL must be a valid URL'),
    handleValidationErrors,
  ],
  createCategory
);

/**
 * @route   PUT /api/product-categories/:id
 * @desc    Update product category
 * @access  Private (productCategories.update)
 */
router.put(
  '/:id',
  requirePermission('productCategories.update'),
  [
    param('id')
      .isUUID()
      .withMessage('Category ID must be a valid UUID'),
    body('name')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Name cannot be empty')
      .isLength({ max: 100 })
      .withMessage('Name must be at most 100 characters'),
    body('imageUrl')
      .optional()
      .isString()
      .trim()
      .isURL()
      .withMessage('Image URL must be a valid URL'),
    handleValidationErrors,
  ],
  updateCategory
);

/**
 * @route   DELETE /api/product-categories/:id
 * @desc    Delete product category (soft delete)
 * @access  Private (productCategories.delete)
 */
router.delete(
  '/:id',
  requirePermission('productCategories.delete'),
  [
    param('id')
      .isUUID()
      .withMessage('Category ID must be a valid UUID'),
    handleValidationErrors,
  ],
  deleteCategory
);

export default router;
