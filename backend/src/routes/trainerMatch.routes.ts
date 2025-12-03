import express from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { handleValidationErrors } from '../middleware/validation.middleware';
import {
  getMatches,
  getMatchById,
  createMatch,
  updateMatchStatus,
  endMatch,
  getTrainerStudents,
  getStudentTrainer
} from '../controllers/trainerMatch.controller';

const router = express.Router();

/**
 * @route   GET /api/trainer-matches/trainer/:trainerId/students
 * @desc    Get all students of a trainer
 * @access  Private (Trainer, GymOwner)
 */
router.get(
  '/trainer/:trainerId/students',
  authenticate,
  [
    param('trainerId').isUUID().withMessage('Invalid trainer ID'),
    query('status').optional().isIn(['active', 'pending', 'ended']).withMessage('Invalid status')
  ],
  handleValidationErrors,
  getTrainerStudents
);

/**
 * @route   GET /api/trainer-matches/student/:studentId/trainer
 * @desc    Get trainer of a student
 * @access  Private (Student, Trainer, GymOwner)
 */
router.get(
  '/student/:studentId/trainer',
  authenticate,
  [
    param('studentId').isUUID().withMessage('Invalid student ID')
  ],
  handleValidationErrors,
  getStudentTrainer
);

/**
 * @route   GET /api/trainer-matches
 * @desc    Get all trainer-student matches
 * @access  Private (GymOwner, Trainer)
 */
router.get(
  '/',
  authenticate,
  requirePermission('trainer_matches.read'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['active', 'pending', 'ended']).withMessage('Invalid status'),
    query('trainerId').optional().isUUID().withMessage('Invalid trainer ID'),
    query('studentId').optional().isUUID().withMessage('Invalid student ID')
  ],
  handleValidationErrors,
  getMatches
);

/**
 * @route   GET /api/trainer-matches/:id
 * @desc    Get match by ID
 * @access  Private (GymOwner, Trainer)
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('trainer_matches.read'),
  [
    param('id').isUUID().withMessage('Invalid match ID')
  ],
  handleValidationErrors,
  getMatchById
);

/**
 * @route   POST /api/trainer-matches
 * @desc    Create trainer-student match
 * @access  Private (GymOwner)
 */
router.post(
  '/',
  authenticate,
  requirePermission('trainer_matches.create'),
  [
    body('trainerId')
      .notEmpty().withMessage('Trainer ID is required')
      .isUUID().withMessage('Invalid trainer ID'),
    body('studentId')
      .notEmpty().withMessage('Student ID is required')
      .isUUID().withMessage('Invalid student ID')
  ],
  handleValidationErrors,
  createMatch
);

/**
 * @route   PATCH /api/trainer-matches/:id/status
 * @desc    Update match status
 * @access  Private (GymOwner, Trainer)
 */
router.patch(
  '/:id/status',
  authenticate,
  requirePermission('trainer_matches.update'),
  [
    param('id').isUUID().withMessage('Invalid match ID'),
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(['active', 'pending', 'ended']).withMessage('Status must be active, pending, or ended')
  ],
  handleValidationErrors,
  updateMatchStatus
);

/**
 * @route   DELETE /api/trainer-matches/:id
 * @desc    End trainer-student match
 * @access  Private (GymOwner)
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('trainer_matches.delete'),
  [
    param('id').isUUID().withMessage('Invalid match ID')
  ],
  handleValidationErrors,
  endMatch
);

export default router;
