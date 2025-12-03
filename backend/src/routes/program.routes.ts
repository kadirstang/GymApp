import express from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { handleValidationErrors } from '../middleware/validation.middleware';
import {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  cloneProgram,
  getProgramStats,
} from '../controllers/program.controller';
import programExerciseRoutes from './programExercise.routes';

const router = express.Router();

// Mount program exercises routes
router.use('/:programId/exercises', programExerciseRoutes);

/**
 * @route   GET /api/programs/stats
 * @desc    Get workout program statistics
 * @access  Private (programs.read)
 */
router.get(
  '/stats',
  authenticate,
  requirePermission('programs.read'),
  getProgramStats
);

/**
 * @route   GET /api/programs
 * @desc    Get all workout programs with filtering and pagination
 * @access  Private (programs.read)
 */
router.get(
  '/',
  authenticate,
  requirePermission('programs.read'),
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
      .withMessage('Search must be a string'),
    query('difficultyLevel')
      .optional()
      .isIn(['Beginner', 'Intermediate', 'Advanced'])
      .withMessage('Difficulty level must be Beginner, Intermediate, or Advanced'),
    query('assignedUserId')
      .optional()
      .isUUID()
      .withMessage('Assigned user ID must be a valid UUID'),
    query('creatorId')
      .optional()
      .isUUID()
      .withMessage('Creator ID must be a valid UUID'),
  ],
  handleValidationErrors,
  getPrograms
);

/**
 * @route   GET /api/programs/:id
 * @desc    Get single workout program by ID
 * @access  Private (programs.read)
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('programs.read'),
  [
    param('id')
      .isUUID()
      .withMessage('Invalid program ID'),
  ],
  handleValidationErrors,
  getProgramById
);

/**
 * @route   POST /api/programs
 * @desc    Create new workout program
 * @access  Private (programs.create)
 */
router.post(
  '/',
  authenticate,
  requirePermission('programs.create'),
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),
    body('difficultyLevel')
      .optional()
      .isIn(['Beginner', 'Intermediate', 'Advanced'])
      .withMessage('Difficulty level must be Beginner, Intermediate, or Advanced'),
    body('assignedUserId')
      .optional({ nullable: true, checkFalsy: true })
      .isUUID()
      .withMessage('Assigned user ID must be a valid UUID'),
  ],
  handleValidationErrors,
  createProgram
);

/**
 * @route   PUT /api/programs/:id
 * @desc    Update workout program
 * @access  Private (programs.update)
 */
router.put(
  '/:id',
  authenticate,
  requirePermission('programs.update'),
  [
    param('id')
      .isUUID()
      .withMessage('Invalid program ID'),
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Name cannot be empty')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),
    body('difficultyLevel')
      .optional()
      .isIn(['Beginner', 'Intermediate', 'Advanced'])
      .withMessage('Difficulty level must be Beginner, Intermediate, or Advanced'),
    body('assignedUserId')
      .optional({ nullable: true, checkFalsy: true })
      .isUUID()
      .withMessage('Assigned user ID must be a valid UUID'),
  ],
  handleValidationErrors,
  updateProgram
);

/**
 * @route   DELETE /api/programs/:id
 * @desc    Delete workout program (soft delete)
 * @access  Private (programs.delete)
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('programs.delete'),
  [
    param('id')
      .isUUID()
      .withMessage('Invalid program ID'),
  ],
  handleValidationErrors,
  deleteProgram
);

/**
 * @route   POST /api/programs/:id/clone
 * @desc    Clone/copy workout program
 * @access  Private (programs.create)
 */
router.post(
  '/:id/clone',
  authenticate,
  requirePermission('programs.create'),
  [
    param('id')
      .isUUID()
      .withMessage('Invalid program ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('assignedUserId')
      .optional({ nullable: true, checkFalsy: true })
      .isUUID()
      .withMessage('Assigned user ID must be a valid UUID'),
  ],
  handleValidationErrors,
  cloneProgram
);

export default router;
