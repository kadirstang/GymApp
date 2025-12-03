import express from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { gymLogoUpload } from '../middleware/upload.middleware';
import { handleValidationErrors } from '../middleware/validation.middleware';
import {
  getGyms,
  getGymById,
  createGym,
  updateGym,
  toggleGymActive,
  deleteGym,
  getGymStats
} from '../controllers/gym.controller';
import {
  uploadGymLogo,
  deleteGymLogo
} from '../controllers/gymLogo.controller';

const router = express.Router();

/**
 * @route   GET /api/gyms
 * @desc    Get all gyms (SuperAdmin only)
 * @access  Private (SuperAdmin)
 */
router.get(
  '/',
  authenticate,
  requirePermission('gyms.read'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().trim(),
    query('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ],
  handleValidationErrors,
  getGyms
);

/**
 * @route   GET /api/gyms/:id
 * @desc    Get gym by ID
 * @access  Private (SuperAdmin or GymOwner of that gym)
 */
router.get(
  '/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid gym ID')
  ],
  handleValidationErrors,
  getGymById
);

/**
 * @route   GET /api/gyms/:id/stats
 * @desc    Get gym statistics
 * @access  Private (SuperAdmin or GymOwner of that gym)
 */
router.get(
  '/:id/stats',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid gym ID')
  ],
  handleValidationErrors,
  getGymStats
);

/**
 * @route   POST /api/gyms
 * @desc    Create new gym
 * @access  Private (SuperAdmin only)
 */
router.post(
  '/',
  authenticate,
  requirePermission('gyms.create'),
  [
    body('name')
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
      .trim(),
    body('slug')
      .notEmpty().withMessage('Slug is required')
      .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Slug must be lowercase alphanumeric with hyphens')
      .isLength({ min: 2, max: 50 }).withMessage('Slug must be between 2 and 50 characters')
      .trim(),
    body('address')
      .optional()
      .isString().withMessage('Address must be a string')
      .trim(),
    body('contactPhone')
      .optional()
      .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/).withMessage('Invalid phone number format'),
    body('logoUrl')
      .optional()
      .isURL().withMessage('Logo URL must be a valid URL')
  ],
  handleValidationErrors,
  createGym
);

/**
 * @route   PUT /api/gyms/:id
 * @desc    Update gym
 * @access  Private (SuperAdmin or GymOwner of that gym)
 */
router.put(
  '/:id',
  authenticate,
  requirePermission('gyms.update'),
  [
    param('id').isUUID().withMessage('Invalid gym ID'),
    body('name')
      .optional()
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
      .trim(),
    body('slug')
      .optional()
      .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Slug must be lowercase alphanumeric with hyphens')
      .isLength({ min: 2, max: 50 }).withMessage('Slug must be between 2 and 50 characters')
      .trim(),
    body('address')
      .optional()
      .isString().withMessage('Address must be a string')
      .trim(),
    body('contactPhone')
      .optional()
      .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/).withMessage('Invalid phone number format'),
    body('logoUrl')
      .optional()
      .isURL().withMessage('Logo URL must be a valid URL')
  ],
  handleValidationErrors,
  updateGym
);

/**
 * @route   PATCH /api/gyms/:id/toggle-active
 * @desc    Toggle gym activation status
 * @access  Private (SuperAdmin only)
 */
router.patch(
  '/:id/toggle-active',
  authenticate,
  requirePermission('gyms.update'),
  [
    param('id').isUUID().withMessage('Invalid gym ID')
  ],
  handleValidationErrors,
  toggleGymActive
);

/**
 * @route   DELETE /api/gyms/:id
 * @desc    Soft delete gym
 * @access  Private (SuperAdmin only)
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('gyms.delete'),
  [
    param('id').isUUID().withMessage('Invalid gym ID')
  ],
  handleValidationErrors,
  deleteGym
);

/**
 * @route   POST /api/gyms/:id/logo
 * @desc    Upload gym logo
 * @access  Private (SuperAdmin or GymOwner of that gym)
 */
router.post(
  '/:id/logo',
  authenticate,
  requirePermission('gyms.update'),
  [
    param('id').isUUID().withMessage('Invalid gym ID')
  ],
  handleValidationErrors,
  gymLogoUpload.single('logo'),
  uploadGymLogo
);

/**
 * @route   DELETE /api/gyms/:id/logo
 * @desc    Delete gym logo
 * @access  Private (SuperAdmin or GymOwner of that gym)
 */
router.delete(
  '/:id/logo',
  authenticate,
  requirePermission('gyms.update'),
  [
    param('id').isUUID().withMessage('Invalid gym ID')
  ],
  handleValidationErrors,
  deleteGymLogo
);

export default router;
