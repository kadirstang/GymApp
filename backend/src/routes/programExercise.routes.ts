import express from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { handleValidationErrors } from '../middleware/validation.middleware';
import {
  getProgramExercises,
  getProgramExerciseById,
  addExerciseToProgram,
  updateProgramExercise,
  removeExerciseFromProgram,
  reorderProgramExercises,
} from '../controllers/programExercise.controller';

const router = express.Router({ mergeParams: true }); // mergeParams to access :programId from parent router

/**
 * @route   GET /api/programs/:programId/exercises
 * @desc    Get all exercises in a program
 * @access  Private (programs.read)
 */
router.get(
  '/',
  authenticate,
  requirePermission('programs.read'),
  [
    param('programId')
      .isUUID()
      .withMessage('Invalid program ID'),
  ],
  handleValidationErrors,
  getProgramExercises
);

/**
 * @route   GET /api/programs/:programId/exercises/:id
 * @desc    Get single program exercise by ID
 * @access  Private (programs.read)
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('programs.read'),
  [
    param('programId')
      .isUUID()
      .withMessage('Invalid program ID'),
    param('id')
      .isUUID()
      .withMessage('Invalid exercise ID'),
  ],
  handleValidationErrors,
  getProgramExerciseById
);

/**
 * @route   POST /api/programs/:programId/exercises
 * @desc    Add exercise to program
 * @access  Private (programs.update)
 */
router.post(
  '/',
  authenticate,
  requirePermission('programs.update'),
  [
    param('programId')
      .isUUID()
      .withMessage('Invalid program ID'),
    body('exerciseId')
      .isUUID()
      .withMessage('Exercise ID must be a valid UUID'),
    body('sets')
      .isInt({ min: 1, max: 20 })
      .withMessage('Sets must be between 1 and 20'),
    body('reps')
      .trim()
      .notEmpty()
      .withMessage('Reps is required')
      .isLength({ max: 20 })
      .withMessage('Reps must not exceed 20 characters'),
    body('restTimeSeconds')
      .optional({ nullable: true, checkFalsy: true })
      .isInt({ min: 0, max: 600 })
      .withMessage('Rest time must be between 0 and 600 seconds'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes must not exceed 500 characters'),
    body('orderIndex')
      .optional({ nullable: true, checkFalsy: true })
      .isInt({ min: 0 })
      .withMessage('Order index must be a non-negative integer'),
  ],
  handleValidationErrors,
  addExerciseToProgram
);

/**
 * @route   PUT /api/programs/:programId/exercises/:id
 * @desc    Update program exercise
 * @access  Private (programs.update)
 */
router.put(
  '/:id',
  authenticate,
  requirePermission('programs.update'),
  [
    param('programId')
      .isUUID()
      .withMessage('Invalid program ID'),
    param('id')
      .isUUID()
      .withMessage('Invalid exercise ID'),
    body('sets')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Sets must be between 1 and 20'),
    body('reps')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Reps cannot be empty')
      .isLength({ max: 20 })
      .withMessage('Reps must not exceed 20 characters'),
    body('restTimeSeconds')
      .optional({ nullable: true, checkFalsy: true })
      .isInt({ min: 0, max: 600 })
      .withMessage('Rest time must be between 0 and 600 seconds'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes must not exceed 500 characters'),
    body('orderIndex')
      .optional({ nullable: true, checkFalsy: true })
      .isInt({ min: 0 })
      .withMessage('Order index must be a non-negative integer'),
  ],
  handleValidationErrors,
  updateProgramExercise
);

/**
 * @route   DELETE /api/programs/:programId/exercises/:id
 * @desc    Remove exercise from program
 * @access  Private (programs.update)
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('programs.update'),
  [
    param('programId')
      .isUUID()
      .withMessage('Invalid program ID'),
    param('id')
      .isUUID()
      .withMessage('Invalid exercise ID'),
  ],
  handleValidationErrors,
  removeExerciseFromProgram
);

/**
 * @route   POST /api/programs/:programId/exercises/reorder
 * @desc    Reorder exercises in program
 * @access  Private (programs.update)
 */
router.post(
  '/reorder',
  authenticate,
  requirePermission('programs.update'),
  [
    param('programId')
      .isUUID()
      .withMessage('Invalid program ID'),
    body('exerciseOrders')
      .isArray({ min: 1 })
      .withMessage('Exercise orders must be a non-empty array'),
    body('exerciseOrders.*.id')
      .isUUID()
      .withMessage('Each exercise must have a valid UUID'),
    body('exerciseOrders.*.orderIndex')
      .isInt({ min: 0 })
      .withMessage('Each exercise must have a valid order index'),
  ],
  handleValidationErrors,
  reorderProgramExercises
);

export default router;
