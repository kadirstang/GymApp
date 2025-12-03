import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import * as authMiddleware from '../middleware/auth.middleware';
import * as rbacMiddleware from '../middleware/rbac.middleware';
import * as gymIsolationMiddleware from '../middleware/gymIsolation.middleware';
import { body, query } from 'express-validator';
const validate = require('../middleware/validate');

const router = Router();

// All user routes require authentication
router.use(authMiddleware.authenticate);

/**
 * @route   GET /api/users
 * @desc    Get all users (paginated, filtered)
 * @access  Private (requires users.read permission)
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('role').optional().isString(),
    query('search').optional().isString(),
    validate,
  ],
  gymIsolationMiddleware.enforceGymIsolation,
  rbacMiddleware.requirePermission('users.read'),
  userController.getUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get(
  '/:id',
  gymIsolationMiddleware.verifySameGymUser('id'),
  userController.getUserById
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private (own profile or users.update permission)
 */
router.put(
  '/:id',
  [
    body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
    body('email').optional().isEmail().withMessage('Invalid email'),
    body('avatarUrl').optional().isURL().withMessage('Invalid avatar URL'),
    body('birthDate').optional().isISO8601().withMessage('Invalid birth date'),
    body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
    body('roleId').optional().isUUID().withMessage('Invalid role ID'),
    validate,
  ],
  gymIsolationMiddleware.verifySameGymUser('id'),
  userController.updateUser
);

/**
 * @route   PUT /api/users/:id/password
 * @desc    Change user password
 * @access  Private (own password only)
 */
router.put(
  '/:id/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
    validate,
  ],
  userController.changePassword
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (requires users.delete permission)
 */
router.delete(
  '/:id',
  gymIsolationMiddleware.verifySameGymUser('id'),
  rbacMiddleware.requirePermission('users.delete'),
  userController.deleteUser
);

/**
 * @route   GET /api/users/:id/measurements
 * @desc    Get user measurements
 * @access  Private
 */
router.get(
  '/:id/measurements',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validate,
  ],
  gymIsolationMiddleware.verifySameGymUser('id'),
  userController.getUserMeasurements
);

/**
 * @route   POST /api/users/:id/measurements
 * @desc    Add user measurement
 * @access  Private
 */
router.post(
  '/:id/measurements',
  [
    body('weight').optional().isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
    body('height').optional().isFloat({ min: 0 }).withMessage('Height must be a positive number'),
    body('bodyFatPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Body fat percentage must be between 0 and 100'),
    body('muscleMass').optional().isFloat({ min: 0 }).withMessage('Muscle mass must be a positive number'),
    validate,
  ],
  gymIsolationMiddleware.verifySameGymUser('id'),
  userController.addUserMeasurement
);

/**
 * @route   PUT /api/users/:userId/measurements/:measurementId
 * @desc    Update user measurement
 * @access  Private
 */
router.put(
  '/:userId/measurements/:measurementId',
  [
    body('weight').optional().isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
    body('height').optional().isFloat({ min: 0 }).withMessage('Height must be a positive number'),
    body('bodyFatPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Body fat percentage must be between 0 and 100'),
    body('muscleMass').optional().isFloat({ min: 0 }).withMessage('Muscle mass must be a positive number'),
    validate,
  ],
  gymIsolationMiddleware.verifySameGymUser('userId'),
  userController.updateUserMeasurement
);

/**
 * @route   DELETE /api/users/:userId/measurements/:measurementId
 * @desc    Delete user measurement
 * @access  Private
 */
router.delete(
  '/:userId/measurements/:measurementId',
  gymIsolationMiddleware.verifySameGymUser('userId'),
  userController.deleteUserMeasurement
);

// Avatar upload routes
import * as avatarController from '../controllers/avatar.controller';
import { avatarUpload } from '../middleware/upload.middleware';

/**
 * @route   POST /api/users/:id/avatar
 * @desc    Upload user avatar
 * @access  Private (own avatar or users.update permission)
 */
router.post(
  '/:id/avatar',
  gymIsolationMiddleware.verifySameGymUser('id'),
  avatarUpload.single('avatar'),
  avatarController.uploadAvatar
);

/**
 * @route   DELETE /api/users/:id/avatar
 * @desc    Delete user avatar
 * @access  Private (own avatar or users.update permission)
 */
router.delete(
  '/:id/avatar',
  gymIsolationMiddleware.verifySameGymUser('id'),
  avatarController.deleteUserAvatar
);

export default router;
