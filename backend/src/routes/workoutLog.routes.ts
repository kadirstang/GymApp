import express from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { handleValidationErrors } from '../middleware/validation.middleware';
import {
  getWorkoutLogs,
  getWorkoutLogById,
  startWorkout,
  endWorkout,
  logSet,
  updateSetEntry,
  deleteSetEntry,
  getWorkoutStats,
  getActiveWorkout,
} from '../controllers/workoutLog.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/workout-logs/stats
 * @desc    Get workout statistics
 * @access  Private (workoutLogs.read)
 */
router.get(
  '/stats',
  requirePermission('workoutLogs.read'),
  [
    query('userId')
      .optional()
      .isUUID()
      .withMessage('User ID must be a valid UUID'),
    handleValidationErrors,
  ],
  getWorkoutStats
);

/**
 * @route   GET /api/workout-logs/active
 * @desc    Get active (unfinished) workout
 * @access  Private (workoutLogs.read)
 */
router.get(
  '/active',
  requirePermission('workoutLogs.read'),
  getActiveWorkout
);

/**
 * @route   GET /api/workout-logs
 * @desc    Get all workout logs with filtering
 * @access  Private (workoutLogs.read)
 */
router.get(
  '/',
  requirePermission('workoutLogs.read'),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('programId')
      .optional()
      .isUUID()
      .withMessage('Program ID must be a valid UUID'),
    query('userId')
      .optional()
      .isUUID()
      .withMessage('User ID must be a valid UUID'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    handleValidationErrors,
  ],
  getWorkoutLogs
);

/**
 * @route   GET /api/workout-logs/:id
 * @desc    Get single workout log by ID
 * @access  Private (workoutLogs.read)
 */
router.get(
  '/:id',
  requirePermission('workoutLogs.read'),
  [
    param('id')
      .isUUID()
      .withMessage('Workout log ID must be a valid UUID'),
    handleValidationErrors,
  ],
  getWorkoutLogById
);

/**
 * @route   POST /api/workout-logs/start
 * @desc    Start a new workout session
 * @access  Private (workoutLogs.create)
 */
router.post(
  '/start',
  requirePermission('workoutLogs.create'),
  [
    body('programId')
      .isUUID()
      .withMessage('Program ID must be a valid UUID'),
    body('notes')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes must be at most 1000 characters'),
    handleValidationErrors,
  ],
  startWorkout
);

/**
 * @route   PUT /api/workout-logs/:id/end
 * @desc    End/finish a workout session
 * @access  Private (workoutLogs.update)
 */
router.put(
  '/:id/end',
  requirePermission('workoutLogs.update'),
  [
    param('id')
      .isUUID()
      .withMessage('Workout log ID must be a valid UUID'),
    body('notes')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes must be at most 1000 characters'),
    handleValidationErrors,
  ],
  endWorkout
);

/**
 * @route   POST /api/workout-logs/:workoutLogId/sets
 * @desc    Log a set for a workout
 * @access  Private (workoutLogs.update)
 */
router.post(
  '/:workoutLogId/sets',
  requirePermission('workoutLogs.update'),
  [
    param('workoutLogId')
      .isUUID()
      .withMessage('Workout log ID must be a valid UUID'),
    body('exerciseId')
      .isUUID()
      .withMessage('Exercise ID must be a valid UUID'),
    body('setNumber')
      .isInt({ min: 1 })
      .withMessage('Set number must be a positive integer'),
    body('weightKg')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Weight must be a positive number'),
    body('repsCompleted')
      .isInt({ min: 0 })
      .withMessage('Reps completed must be a non-negative integer'),
    body('rpe')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('RPE must be between 1 and 10'),
    handleValidationErrors,
  ],
  logSet
);

/**
 * @route   PUT /api/workout-logs/:workoutLogId/sets/:entryId
 * @desc    Update a set entry
 * @access  Private (workoutLogs.update)
 */
router.put(
  '/:workoutLogId/sets/:entryId',
  requirePermission('workoutLogs.update'),
  [
    param('workoutLogId')
      .isUUID()
      .withMessage('Workout log ID must be a valid UUID'),
    param('entryId')
      .isUUID()
      .withMessage('Entry ID must be a valid UUID'),
    body('weightKg')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Weight must be a positive number'),
    body('repsCompleted')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Reps completed must be a non-negative integer'),
    body('rpe')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('RPE must be between 1 and 10'),
    handleValidationErrors,
  ],
  updateSetEntry
);

/**
 * @route   DELETE /api/workout-logs/:workoutLogId/sets/:entryId
 * @desc    Delete a set entry
 * @access  Private (workoutLogs.update)
 */
router.delete(
  '/:workoutLogId/sets/:entryId',
  requirePermission('workoutLogs.update'),
  [
    param('workoutLogId')
      .isUUID()
      .withMessage('Workout log ID must be a valid UUID'),
    param('entryId')
      .isUUID()
      .withMessage('Entry ID must be a valid UUID'),
    handleValidationErrors,
  ],
  deleteSetEntry
);

export default router;
