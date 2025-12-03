"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const gym_controller_1 = require("../controllers/gym.controller");
const gymLogo_controller_1 = require("../controllers/gymLogo.controller");
const router = express_1.default.Router();
router.get('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('gyms.read'), [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('search').optional().isString().trim(),
    (0, express_validator_1.query)('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], validation_middleware_1.handleValidationErrors, gym_controller_1.getGyms);
router.get('/:id', auth_middleware_1.authenticate, [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid gym ID')
], validation_middleware_1.handleValidationErrors, gym_controller_1.getGymById);
router.get('/:id/stats', auth_middleware_1.authenticate, [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid gym ID')
], validation_middleware_1.handleValidationErrors, gym_controller_1.getGymStats);
router.post('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('gyms.create'), [
    (0, express_validator_1.body)('name')
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
        .trim(),
    (0, express_validator_1.body)('slug')
        .notEmpty().withMessage('Slug is required')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Slug must be lowercase alphanumeric with hyphens')
        .isLength({ min: 2, max: 50 }).withMessage('Slug must be between 2 and 50 characters')
        .trim(),
    (0, express_validator_1.body)('address')
        .optional()
        .isString().withMessage('Address must be a string')
        .trim(),
    (0, express_validator_1.body)('contactPhone')
        .optional()
        .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/).withMessage('Invalid phone number format'),
    (0, express_validator_1.body)('logoUrl')
        .optional()
        .isURL().withMessage('Logo URL must be a valid URL')
], validation_middleware_1.handleValidationErrors, gym_controller_1.createGym);
router.put('/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('gyms.update'), [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid gym ID'),
    (0, express_validator_1.body)('name')
        .optional()
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
        .trim(),
    (0, express_validator_1.body)('slug')
        .optional()
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Slug must be lowercase alphanumeric with hyphens')
        .isLength({ min: 2, max: 50 }).withMessage('Slug must be between 2 and 50 characters')
        .trim(),
    (0, express_validator_1.body)('address')
        .optional()
        .isString().withMessage('Address must be a string')
        .trim(),
    (0, express_validator_1.body)('contactPhone')
        .optional()
        .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/).withMessage('Invalid phone number format'),
    (0, express_validator_1.body)('logoUrl')
        .optional()
        .isURL().withMessage('Logo URL must be a valid URL')
], validation_middleware_1.handleValidationErrors, gym_controller_1.updateGym);
router.patch('/:id/toggle-active', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('gyms.update'), [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid gym ID')
], validation_middleware_1.handleValidationErrors, gym_controller_1.toggleGymActive);
router.delete('/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('gyms.delete'), [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid gym ID')
], validation_middleware_1.handleValidationErrors, gym_controller_1.deleteGym);
router.post('/:id/logo', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('gyms.update'), [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid gym ID')
], validation_middleware_1.handleValidationErrors, upload_middleware_1.gymLogoUpload.single('logo'), gymLogo_controller_1.uploadGymLogo);
router.delete('/:id/logo', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('gyms.update'), [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid gym ID')
], validation_middleware_1.handleValidationErrors, gymLogo_controller_1.deleteGymLogo);
exports.default = router;
//# sourceMappingURL=gym.routes.js.map