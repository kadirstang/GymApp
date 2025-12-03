import express from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getRoleTemplates,
  createRoleFromTemplate
} from '../controllers/role.controller';

const router = express.Router();

/**
 * @route   GET /api/roles/templates
 * @desc    Get role templates
 * @access  Private (GymOwner)
 */
router.get(
  '/templates',
  authenticate,
  requirePermission('roles.read'),
  getRoleTemplates
);

/**
 * @route   POST /api/roles/from-template
 * @desc    Create role from template
 * @access  Private (GymOwner)
 */
router.post(
  '/from-template',
  authenticate,
  requirePermission('roles.create'),
  [
    body('templateName')
      .notEmpty().withMessage('Template name is required')
      .isIn(['GymOwner', 'Trainer', 'Student', 'Receptionist', 'Assistant Trainer'])
      .withMessage('Invalid template name'),
    body('customName')
      .optional()
      .isString().withMessage('Custom name must be a string')
      .isLength({ min: 2, max: 50 }).withMessage('Custom name must be between 2 and 50 characters')
      .trim()
  ],
  createRoleFromTemplate
);

/**
 * @route   GET /api/roles
 * @desc    Get all roles for gym
 * @access  Private (GymOwner)
 */
router.get(
  '/',
  authenticate,
  requirePermission('roles.read'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  getRoles
);

/**
 * @route   GET /api/roles/:id
 * @desc    Get role by ID
 * @access  Private (GymOwner)
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('roles.read'),
  [
    param('id').isUUID().withMessage('Invalid role ID')
  ],
  getRoleById
);

/**
 * @route   POST /api/roles
 * @desc    Create new role
 * @access  Private (GymOwner)
 */
router.post(
  '/',
  authenticate,
  requirePermission('roles.create'),
  [
    body('name')
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
      .trim(),
    body('permissions')
      .optional()
      .isObject().withMessage('Permissions must be an object')
  ],
  createRole
);

/**
 * @route   PUT /api/roles/:id
 * @desc    Update role
 * @access  Private (GymOwner)
 */
router.put(
  '/:id',
  authenticate,
  requirePermission('roles.update'),
  [
    param('id').isUUID().withMessage('Invalid role ID'),
    body('name')
      .optional()
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
      .trim(),
    body('permissions')
      .optional()
      .isObject().withMessage('Permissions must be an object')
  ],
  updateRole
);

/**
 * @route   DELETE /api/roles/:id
 * @desc    Delete role
 * @access  Private (GymOwner)
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('roles.delete'),
  [
    param('id').isUUID().withMessage('Invalid role ID')
  ],
  deleteRole
);

export default router;
