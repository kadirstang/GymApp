"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const workoutLog_controller_1 = require("../controllers/workoutLog.controller");
const router = express_1.default.Router();
router.use(auth_middleware_1.authenticate);
router.get('/stats', (0, rbac_middleware_1.requirePermission)('workoutLogs.read'), [
    (0, express_validator_1.query)('userId')
        .optional()
        .isUUID()
        .withMessage('User ID must be a valid UUID'),
    validation_middleware_1.handleValidationErrors,
], workoutLog_controller_1.getWorkoutStats);
router.get('/active', (0, rbac_middleware_1.requirePermission)('workoutLogs.read'), workoutLog_controller_1.getActiveWorkout);
router.get('/', (0, rbac_middleware_1.requirePermission)('workoutLogs.read'), [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('programId')
        .optional()
        .isUUID()
        .withMessage('Program ID must be a valid UUID'),
    (0, express_validator_1.query)('userId')
        .optional()
        .isUUID()
        .withMessage('User ID must be a valid UUID'),
    (0, express_validator_1.query)('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid ISO 8601 date'),
    (0, express_validator_1.query)('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid ISO 8601 date'),
    validation_middleware_1.handleValidationErrors,
], workoutLog_controller_1.getWorkoutLogs);
router.get('/:id', (0, rbac_middleware_1.requirePermission)('workoutLogs.read'), [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Workout log ID must be a valid UUID'),
    validation_middleware_1.handleValidationErrors,
], workoutLog_controller_1.getWorkoutLogById);
router.post('/start', (0, rbac_middleware_1.requirePermission)('workoutLogs.create'), [
    (0, express_validator_1.body)('programId')
        .isUUID()
        .withMessage('Program ID must be a valid UUID'),
    (0, express_validator_1.body)('notes')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Notes must be at most 1000 characters'),
    validation_middleware_1.handleValidationErrors,
], workoutLog_controller_1.startWorkout);
router.put('/:id/end', (0, rbac_middleware_1.requirePermission)('workoutLogs.update'), [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Workout log ID must be a valid UUID'),
    (0, express_validator_1.body)('notes')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Notes must be at most 1000 characters'),
    validation_middleware_1.handleValidationErrors,
], workoutLog_controller_1.endWorkout);
router.post('/:workoutLogId/sets', (0, rbac_middleware_1.requirePermission)('workoutLogs.update'), [
    (0, express_validator_1.param)('workoutLogId')
        .isUUID()
        .withMessage('Workout log ID must be a valid UUID'),
    (0, express_validator_1.body)('exerciseId')
        .isUUID()
        .withMessage('Exercise ID must be a valid UUID'),
    (0, express_validator_1.body)('setNumber')
        .isInt({ min: 1 })
        .withMessage('Set number must be a positive integer'),
    (0, express_validator_1.body)('weightKg')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Weight must be a positive number'),
    (0, express_validator_1.body)('repsCompleted')
        .isInt({ min: 0 })
        .withMessage('Reps completed must be a non-negative integer'),
    (0, express_validator_1.body)('rpe')
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage('RPE must be between 1 and 10'),
    validation_middleware_1.handleValidationErrors,
], workoutLog_controller_1.logSet);
router.put('/:workoutLogId/sets/:entryId', (0, rbac_middleware_1.requirePermission)('workoutLogs.update'), [
    (0, express_validator_1.param)('workoutLogId')
        .isUUID()
        .withMessage('Workout log ID must be a valid UUID'),
    (0, express_validator_1.param)('entryId')
        .isUUID()
        .withMessage('Entry ID must be a valid UUID'),
    (0, express_validator_1.body)('weightKg')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Weight must be a positive number'),
    (0, express_validator_1.body)('repsCompleted')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Reps completed must be a non-negative integer'),
    (0, express_validator_1.body)('rpe')
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage('RPE must be between 1 and 10'),
    validation_middleware_1.handleValidationErrors,
], workoutLog_controller_1.updateSetEntry);
router.delete('/:workoutLogId/sets/:entryId', (0, rbac_middleware_1.requirePermission)('workoutLogs.update'), [
    (0, express_validator_1.param)('workoutLogId')
        .isUUID()
        .withMessage('Workout log ID must be a valid UUID'),
    (0, express_validator_1.param)('entryId')
        .isUUID()
        .withMessage('Entry ID must be a valid UUID'),
    validation_middleware_1.handleValidationErrors,
], workoutLog_controller_1.deleteSetEntry);
exports.default = router;
//# sourceMappingURL=workoutLog.routes.js.map