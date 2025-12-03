import express from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { handleValidationErrors } from '../middleware/validation.middleware';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getOrderStats,
} from '../controllers/order.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/orders/stats
 * @desc    Get order statistics
 * @access  Private (orders.read)
 */
router.get(
  '/stats',
  requirePermission('orders.read'),
  getOrderStats
);

/**
 * @route   GET /api/orders
 * @desc    Get all orders with filters
 * @access  Private (orders.read)
 */
router.get(
  '/',
  requirePermission('orders.read'),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['pending_approval', 'prepared', 'completed', 'cancelled'])
      .withMessage('Invalid status'),
    query('userId')
      .optional()
      .isUUID()
      .withMessage('User ID must be a valid UUID'),
    handleValidationErrors,
  ],
  getOrders
);

/**
 * @route   GET /api/orders/:id
 * @desc    Get single order by ID
 * @access  Private (orders.read)
 */
router.get(
  '/:id',
  requirePermission('orders.read'),
  [
    param('id')
      .isUUID()
      .withMessage('Order ID must be a valid UUID'),
    handleValidationErrors,
  ],
  getOrderById
);

/**
 * @route   POST /api/orders
 * @desc    Create new order
 * @access  Private (orders.create)
 */
router.post(
  '/',
  requirePermission('orders.create'),
  [
    body('userId')
      .optional()
      .isUUID()
      .withMessage('User ID must be a valid UUID'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('Items must be a non-empty array'),
    body('items.*.productId')
      .isUUID()
      .withMessage('Product ID must be a valid UUID'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
    body('notes')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes must be at most 500 characters'),
    handleValidationErrors,
  ],
  createOrder
);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status
 * @access  Private (orders.update)
 */
router.patch(
  '/:id/status',
  requirePermission('orders.update'),
  [
    param('id')
      .isUUID()
      .withMessage('Order ID must be a valid UUID'),
    body('status')
      .isIn(['pending_approval', 'prepared', 'completed', 'cancelled'])
      .withMessage('Status must be one of: pending_approval, prepared, completed, cancelled'),
    handleValidationErrors,
  ],
  updateOrderStatus
);

/**
 * @route   DELETE /api/orders/:id
 * @desc    Cancel/Delete order
 * @access  Private (orders.delete)
 */
router.delete(
  '/:id',
  requirePermission('orders.delete'),
  [
    param('id')
      .isUUID()
      .withMessage('Order ID must be a valid UUID'),
    handleValidationErrors,
  ],
  deleteOrder
);

export default router;
