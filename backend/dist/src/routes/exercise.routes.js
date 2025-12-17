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
const upload_middleware_1 = require("../middleware/upload.middleware");
const exercise_controller_1 = require("../controllers/exercise.controller");
const router = express_1.default.Router();
router.get('/muscle-groups', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('exercises.read'), exercise_controller_1.getMuscleGroups);
router.get('/stats', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('exercises.read'), exercise_controller_1.getExerciseStats);
router.get('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('exercises.read'), [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('search').optional().isString().trim().withMessage('Search must be a string'),
    (0, express_validator_1.query)('targetMuscleGroup').optional().isString().trim().withMessage('Target muscle group must be a string'),
    (0, express_validator_1.query)('equipmentNeededId').optional().isUUID().withMessage('Invalid equipment ID')
], validation_middleware_1.handleValidationErrors, exercise_controller_1.getExercises);
router.get('/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('exercises.read'), [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid exercise ID')
], validation_middleware_1.handleValidationErrors, exercise_controller_1.getExerciseById);
router.post('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('exercises.create'), [
    (0, express_validator_1.body)('name')
        .notEmpty().withMessage('Name is required')
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    (0, express_validator_1.body)('videoUrl')
        .optional()
        .trim()
        .isURL().withMessage('Video URL must be a valid URL'),
    (0, express_validator_1.body)('targetMuscleGroup')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Target muscle group must be less than 50 characters'),
    (0, express_validator_1.body)('equipmentNeededId')
        .optional({ nullable: true, checkFalsy: true })
        .isUUID().withMessage('Invalid equipment ID')
], validation_middleware_1.handleValidationErrors, exercise_controller_1.createExercise);
router.put('/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('exercises.update'), [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid exercise ID'),
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    (0, express_validator_1.body)('videoUrl')
        .optional()
        .trim()
        .isURL().withMessage('Video URL must be a valid URL'),
    (0, express_validator_1.body)('targetMuscleGroup')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Target muscle group must be less than 50 characters'),
    (0, express_validator_1.body)('equipmentNeededId')
        .optional({ nullable: true, checkFalsy: true })
        .isUUID().withMessage('Invalid equipment ID')
], validation_middleware_1.handleValidationErrors, exercise_controller_1.updateExercise);
router.delete('/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('exercises.delete'), [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid exercise ID')
], validation_middleware_1.handleValidationErrors, exercise_controller_1.deleteExercise);
router.post('/:id/video', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('exercises.update'), [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid exercise ID')
], validation_middleware_1.handleValidationErrors, upload_middleware_1.exerciseVideoUpload.single('video'), exercise_controller_1.uploadExerciseVideo);
exports.default = router;
//# sourceMappingURL=exercise.routes.js.map