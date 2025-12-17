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
const trainerMatch_controller_1 = require("../controllers/trainerMatch.controller");
const router = express_1.default.Router();
router.get('/my-students', auth_middleware_1.authenticate, trainerMatch_controller_1.getMyStudentsDetailed);
router.get('/my-students/:studentId', auth_middleware_1.authenticate, [
    (0, express_validator_1.param)('studentId').isUUID().withMessage('Invalid student ID')
], validation_middleware_1.handleValidationErrors, trainerMatch_controller_1.getMyStudentDetail);
router.get('/trainer/:trainerId/students', auth_middleware_1.authenticate, [
    (0, express_validator_1.param)('trainerId').isUUID().withMessage('Invalid trainer ID'),
    (0, express_validator_1.query)('status').optional().isIn(['active', 'pending', 'ended']).withMessage('Invalid status')
], validation_middleware_1.handleValidationErrors, trainerMatch_controller_1.getTrainerStudents);
router.get('/student/:studentId/trainer', auth_middleware_1.authenticate, [
    (0, express_validator_1.param)('studentId').isUUID().withMessage('Invalid student ID')
], validation_middleware_1.handleValidationErrors, trainerMatch_controller_1.getStudentTrainer);
router.get('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('trainer_matches.read'), [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('status').optional().isIn(['active', 'pending', 'ended']).withMessage('Invalid status'),
    (0, express_validator_1.query)('trainerId').optional().isUUID().withMessage('Invalid trainer ID'),
    (0, express_validator_1.query)('studentId').optional().isUUID().withMessage('Invalid student ID')
], validation_middleware_1.handleValidationErrors, trainerMatch_controller_1.getMatches);
router.get('/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('trainer_matches.read'), [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid match ID')
], validation_middleware_1.handleValidationErrors, trainerMatch_controller_1.getMatchById);
router.post('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('trainer_matches.create'), [
    (0, express_validator_1.body)('trainerId')
        .notEmpty().withMessage('Trainer ID is required')
        .isUUID().withMessage('Invalid trainer ID'),
    (0, express_validator_1.body)('studentId')
        .notEmpty().withMessage('Student ID is required')
        .isUUID().withMessage('Invalid student ID')
], validation_middleware_1.handleValidationErrors, trainerMatch_controller_1.createMatch);
router.patch('/:id/status', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('trainer_matches.update'), [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid match ID'),
    (0, express_validator_1.body)('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['active', 'pending', 'ended']).withMessage('Status must be active, pending, or ended')
], validation_middleware_1.handleValidationErrors, trainerMatch_controller_1.updateMatchStatus);
router.delete('/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('trainer_matches.delete'), [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid match ID')
], validation_middleware_1.handleValidationErrors, trainerMatch_controller_1.endMatch);
exports.default = router;
//# sourceMappingURL=trainerMatch.routes.js.map