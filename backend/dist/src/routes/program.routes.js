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
const program_controller_1 = require("../controllers/program.controller");
const programExercise_routes_1 = __importDefault(require("./programExercise.routes"));
const router = express_1.default.Router();
router.use('/:programId/exercises', programExercise_routes_1.default);
router.get('/stats', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('programs.read'), program_controller_1.getProgramStats);
router.get('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('programs.read'), [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('search')
        .optional()
        .isString()
        .withMessage('Search must be a string'),
    (0, express_validator_1.query)('difficultyLevel')
        .optional()
        .isIn(['Beginner', 'Intermediate', 'Advanced'])
        .withMessage('Difficulty level must be Beginner, Intermediate, or Advanced'),
    (0, express_validator_1.query)('assignedUserId')
        .optional()
        .isUUID()
        .withMessage('Assigned user ID must be a valid UUID'),
    (0, express_validator_1.query)('creatorId')
        .optional()
        .isUUID()
        .withMessage('Creator ID must be a valid UUID'),
], validation_middleware_1.handleValidationErrors, program_controller_1.getPrograms);
router.get('/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('programs.read'), [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Invalid program ID'),
], validation_middleware_1.handleValidationErrors, program_controller_1.getProgramById);
router.post('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('programs.create'), [
    (0, express_validator_1.body)('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),
    (0, express_validator_1.body)('difficultyLevel')
        .optional()
        .isIn(['Beginner', 'Intermediate', 'Advanced'])
        .withMessage('Difficulty level must be Beginner, Intermediate, or Advanced'),
    (0, express_validator_1.body)('assignedUserId')
        .optional({ nullable: true, checkFalsy: true })
        .isUUID()
        .withMessage('Assigned user ID must be a valid UUID'),
], validation_middleware_1.handleValidationErrors, program_controller_1.createProgram);
router.put('/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('programs.update'), [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Invalid program ID'),
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Name cannot be empty')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),
    (0, express_validator_1.body)('difficultyLevel')
        .optional()
        .isIn(['Beginner', 'Intermediate', 'Advanced'])
        .withMessage('Difficulty level must be Beginner, Intermediate, or Advanced'),
    (0, express_validator_1.body)('assignedUserId')
        .optional({ nullable: true, checkFalsy: true })
        .isUUID()
        .withMessage('Assigned user ID must be a valid UUID'),
], validation_middleware_1.handleValidationErrors, program_controller_1.updateProgram);
router.delete('/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('programs.delete'), [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Invalid program ID'),
], validation_middleware_1.handleValidationErrors, program_controller_1.deleteProgram);
router.post('/:id/clone', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('programs.create'), [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Invalid program ID'),
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('assignedUserId')
        .optional({ nullable: true, checkFalsy: true })
        .isUUID()
        .withMessage('Assigned user ID must be a valid UUID'),
], validation_middleware_1.handleValidationErrors, program_controller_1.cloneProgram);
exports.default = router;
//# sourceMappingURL=program.routes.js.map