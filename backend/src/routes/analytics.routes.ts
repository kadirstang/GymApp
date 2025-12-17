import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';
import * as authMiddleware from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/analytics/revenue-trend
 * @desc    Get revenue trend for last 30 days
 * @access  Private (GymOwner, Trainer)
 */
router.get(
  '/revenue-trend',
  authMiddleware.authenticate,
  analyticsController.getRevenueTrend
);

/**
 * @route   GET /api/analytics/order-status
 * @desc    Get order status distribution
 * @access  Private (GymOwner, Trainer)
 */
router.get(
  '/order-status',
  authMiddleware.authenticate,
  analyticsController.getOrderStatusDistribution
);

/**
 * @route   GET /api/analytics/top-products
 * @desc    Get top selling products
 * @access  Private (GymOwner, Trainer)
 */
router.get(
  '/top-products',
  authMiddleware.authenticate,
  analyticsController.getTopProducts
);

/**
 * @route   GET /api/analytics/active-students
 * @desc    Get active students trend (last 30 days)
 * @access  Private (Trainer, GymOwner)
 */
router.get(
  '/active-students',
  authMiddleware.authenticate,
  analyticsController.getActiveStudentsTrend
);

/**
 * @route   GET /api/analytics/summary
 * @desc    Get dashboard summary statistics
 * @access  Private
 */
router.get(
  '/summary',
  authMiddleware.authenticate,
  analyticsController.getDashboardSummary
);

export default router;
