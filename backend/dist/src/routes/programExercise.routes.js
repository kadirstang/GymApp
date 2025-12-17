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
const programExercise_controller_1 = require("../controllers/programExercise.controller");
const router = express_1.default.Router({ mergeParams: true });
router.get('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('programs.read'), [
    (0, express_validator_1.param)('programId')
        .isUUID()
        .withMessage('Invalid program ID'),
], validation_middleware_1.handleValidationErrors, programExercise_controller_1.getProgramExercises);
router.get('/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('programs.read'), [
    (0, express_validator_1.param)('programId')
        .isUUID()
        .withMessage('Invalid program ID'),
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Invalid exercise ID'),
], validation_middleware_1.handleValidationErrors, programExercise_controller_1.getProgramExerciseById);
router.post('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('programs.update'), [
    (0, express_validator_1.param)('programId')
        .isUUID()
        .withMessage('Invalid program ID'),
    (0, express_validator_1.body)('exerciseId')
        .isUUID()
        .withMessage('Exercise ID must be a valid UUID'),
    (0, express_validator_1.body)('sets')
        .isInt({ min: 1, max: 20 })
        .withMessage('Sets must be between 1 and 20'),
    (0, express_validator_1.body)('reps')
        .trim()
        .notEmpty()
        .withMessage('Reps is required')
        .isLength({ max: 20 })
        .withMessage('Reps must not exceed 20 characters'),
    (0, express_validator_1.body)('restTimeSeconds')
        .optional({ nullable: true, checkFalsy: true })
        .isInt({ min: 0, max: 600 })
        .withMessage('Rest time must be between 0 and 600 seconds'),
    (0, express_validator_1.body)('notes')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Notes must not exceed 500 characters'),
    (0, express_validator_1.body)('orderIndex')
        .optional({ nullable: true, checkFalsy: true })
        .isInt({ min: 0 })
        .withMessage('Order index must be a non-negative integer'),
], validation_middleware_1.handleValidationErrors, programExercise_controller_1.addExerciseToProgram);
router.put('/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('programs.update'), [
    (0, express_validator_1.param)('programId')
        .isUUID()
        .withMessage('Invalid program ID'),
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Invalid exercise ID'),
    (0, express_validator_1.body)('sets')
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage('Sets must be between 1 and 20'),
    (0, express_validator_1.body)('reps')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Reps cannot be empty')
        .isLength({ max: 20 })
        .withMessage('Reps must not exceed 20 characters'),
    (0, express_validator_1.body)('restTimeSeconds')
        .optional({ nullable: true, checkFalsy: true })
        .isInt({ min: 0, max: 600 })
        .withMessage('Rest time must be between 0 and 600 seconds'),
    (0, express_validator_1.body)('notes')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Notes must not exceed 500 characters'),
    (0, express_validator_1.body)('orderIndex')
        .optional({ nullable: true, checkFalsy: true })
        .isInt({ min: 0 })
        .withMessage('Order index must be a non-negative integer'),
], validation_middleware_1.handleValidationErrors, programExercise_controller_1.updateProgramExercise);
router.delete('/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('programs.update'), [
    (0, express_validator_1.param)('programId')
        .isUUID()
        .withMessage('Invalid program ID'),
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Invalid exercise ID'),
], validation_middleware_1.handleValidationErrors, programExercise_controller_1.removeExerciseFromProgram);
router.post('/reorder', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('programs.update'), [
    (0, express_validator_1.param)('programId')
        .isUUID()
        .withMessage('Invalid program ID'),
    (0, express_validator_1.body)('exerciseOrders')
        .isArray({ min: 1 })
        .withMessage('Exercise orders must be a non-empty array'),
    (0, express_validator_1.body)('exerciseOrders.*.id')
        .isUUID()
        .withMessage('Each exercise must have a valid UUID'),
    (0, express_validator_1.body)('exerciseOrders.*.orderIndex')
        .isInt({ min: 0 })
        .withMessage('Each exercise must have a valid order index'),
], validation_middleware_1.handleValidationErrors, programExercise_controller_1.reorderProgramExercises);
exports.default = router;
//# sourceMappingURL=programExercise.routes.js.map