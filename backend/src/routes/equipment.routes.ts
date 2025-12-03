import express from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { handleValidationErrors } from '../middleware/validation.middleware';
import {
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getEquipmentStats,
  getEquipmentByQR,
  generateQRCode,
} from '../controllers/equipment.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/equipment/stats
 * @desc    Get equipment statistics
 * @access  Private (equipment.read)
 */
router.get(
  '/stats',
  requirePermission('equipment.read'),
  getEquipmentStats
);

/**
 * @route   GET /api/equipment/:id/qr-code
 * @desc    Generate QR code image for equipment
 * @access  Private (equipment.read)
 */
router.get(
  '/:id/qr-code',
  requirePermission('equipment.read'),
  [
    param('id')
      .isUUID()
      .withMessage('Equipment ID must be a valid UUID'),
    handleValidationErrors,
  ],
  generateQRCode
);

/**
 * @route   GET /api/equipment/qr/:qrCodeUuid
 * @desc    Get equipment by QR code UUID (for scanning)
 * @access  Private (equipment.read)
 */
router.get(
  '/qr/:qrCodeUuid',
  requirePermission('equipment.read'),
  [
    param('qrCodeUuid')
      .isUUID()
      .withMessage('QR code UUID must be a valid UUID'),
    handleValidationErrors,
  ],
  getEquipmentByQR
);

/**
 * @route   GET /api/equipment
 * @desc    Get all equipment with filtering
 * @access  Private (equipment.read)
 */
router.get(
  '/',
  requirePermission('equipment.read'),
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
    query('status')
      .optional()
      .isIn(['active', 'maintenance', 'broken'])
      .withMessage('Status must be active, maintenance, or broken'),
    handleValidationErrors,
  ],
  getEquipment
);

/**
 * @route   GET /api/equipment/:id
 * @desc    Get single equipment by ID
 * @access  Private (equipment.read)
 */
router.get(
  '/:id',
  requirePermission('equipment.read'),
  [
    param('id')
      .isUUID()
      .withMessage('Equipment ID must be a valid UUID'),
    handleValidationErrors,
  ],
  getEquipmentById
);

/**
 * @route   POST /api/equipment
 * @desc    Create new equipment
 * @access  Private (equipment.create)
 */
router.post(
  '/',
  requirePermission('equipment.create'),
  [
    body('name')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 100 })
      .withMessage('Name must be at most 100 characters'),
    body('description')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be at most 1000 characters'),
    body('videoUrl')
      .optional()
      .isString()
      .trim()
      .isURL()
      .withMessage('Video URL must be a valid URL'),
    body('status')
      .optional()
      .isIn(['active', 'maintenance', 'broken'])
      .withMessage('Status must be active, maintenance, or broken'),
    handleValidationErrors,
  ],
  createEquipment
);

/**
 * @route   PUT /api/equipment/:id
 * @desc    Update equipment
 * @access  Private (equipment.update)
 */
router.put(
  '/:id',
  requirePermission('equipment.update'),
  [
    param('id')
      .isUUID()
      .withMessage('Equipment ID must be a valid UUID'),
    body('name')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Name cannot be empty')
      .isLength({ max: 100 })
      .withMessage('Name must be at most 100 characters'),
    body('description')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be at most 1000 characters'),
    body('videoUrl')
      .optional()
      .isString()
      .trim()
      .isURL()
      .withMessage('Video URL must be a valid URL'),
    body('status')
      .optional()
      .isIn(['active', 'maintenance', 'broken'])
      .withMessage('Status must be active, maintenance, or broken'),
    handleValidationErrors,
  ],
  updateEquipment
);

/**
 * @route   DELETE /api/equipment/:id
 * @desc    Delete equipment (soft delete)
 * @access  Private (equipment.delete)
 */
router.delete(
  '/:id',
  requirePermission('equipment.delete'),
  [
    param('id')
      .isUUID()
      .withMessage('Equipment ID must be a valid UUID'),
    handleValidationErrors,
  ],
  deleteEquipment
);

export default router;
