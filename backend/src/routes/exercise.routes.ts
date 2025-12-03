import express from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { handleValidationErrors } from '../middleware/validation.middleware';
import {
  getExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
  getMuscleGroups,
  getExerciseStats
} from '../controllers/exercise.controller';

const router = express.Router();

/**
 * @route   GET /api/exercises/muscle-groups
 * @desc    Get list of muscle groups
 * @access  Private (exercises.read)
 */
router.get(
  '/muscle-groups',
  authenticate,
  requirePermission('exercises.read'),
  getMuscleGroups
);

/**
 * @route   GET /api/exercises/stats
 * @desc    Get exercise statistics
 * @access  Private (exercises.read)
 */
router.get(
  '/stats',
  authenticate,
  requirePermission('exercises.read'),
  getExerciseStats
);

/**
 * @route   GET /api/exercises
 * @desc    Get all exercises (paginated, filterable)
 * @access  Private (exercises.read)
 */
router.get(
  '/',
  authenticate,
  requirePermission('exercises.read'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().trim().withMessage('Search must be a string'),
    query('targetMuscleGroup').optional().isString().trim().withMessage('Target muscle group must be a string'),
    query('equipmentNeededId').optional().isUUID().withMessage('Invalid equipment ID')
  ],
  handleValidationErrors,
  getExercises
);

/**
 * @route   GET /api/exercises/:id
 * @desc    Get exercise by ID
 * @access  Private (exercises.read)
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('exercises.read'),
  [
    param('id').isUUID().withMessage('Invalid exercise ID')
  ],
  handleValidationErrors,
  getExerciseById
);

/**
 * @route   POST /api/exercises
 * @desc    Create new exercise
 * @access  Private (exercises.create - GymOwner, Trainer)
 */
router.post(
  '/',
  authenticate,
  requirePermission('exercises.create'),
  [
    body('name')
      .notEmpty().withMessage('Name is required')
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    body('videoUrl')
      .optional()
      .trim()
      .isURL().withMessage('Video URL must be a valid URL'),
    body('targetMuscleGroup')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Target muscle group must be less than 50 characters'),
    body('equipmentNeededId')
      .optional({ nullable: true, checkFalsy: true })
      .isUUID().withMessage('Invalid equipment ID')
  ],
  handleValidationErrors,
  createExercise
);

/**
 * @route   PUT /api/exercises/:id
 * @desc    Update exercise
 * @access  Private (exercises.update - GymOwner, Trainer)
 */
router.put(
  '/:id',
  authenticate,
  requirePermission('exercises.update'),
  [
    param('id').isUUID().withMessage('Invalid exercise ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    body('videoUrl')
      .optional()
      .trim()
      .isURL().withMessage('Video URL must be a valid URL'),
    body('targetMuscleGroup')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Target muscle group must be less than 50 characters'),
    body('equipmentNeededId')
      .optional({ nullable: true, checkFalsy: true })
      .isUUID().withMessage('Invalid equipment ID')
  ],
  handleValidationErrors,
  updateExercise
);

/**
 * @route   DELETE /api/exercises/:id
 * @desc    Delete exercise (soft delete)
 * @access  Private (exercises.delete - GymOwner, Trainer)
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('exercises.delete'),
  [
    param('id').isUUID().withMessage('Invalid exercise ID')
  ],
  handleValidationErrors,
  deleteExercise
);

export default router;
