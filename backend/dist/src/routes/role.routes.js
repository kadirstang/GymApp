"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const role_controller_1 = require("../controllers/role.controller");
const router = express_1.default.Router();
router.get('/templates', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('roles.read'), role_controller_1.getRoleTemplates);
router.post('/from-template', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('roles.create'), [
    (0, express_validator_1.body)('templateName')
        .notEmpty().withMessage('Template name is required')
        .isIn(['GymOwner', 'Trainer', 'Student', 'Receptionist', 'Assistant Trainer'])
        .withMessage('Invalid template name'),
    (0, express_validator_1.body)('customName')
        .optional()
        .isString().withMessage('Custom name must be a string')
        .isLength({ min: 2, max: 50 }).withMessage('Custom name must be between 2 and 50 characters')
        .trim()
], role_controller_1.createRoleFromTemplate);
router.get('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('roles.read'), [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], role_controller_1.getRoles);
router.get('/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('roles.read'), [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid role ID')
], role_controller_1.getRoleById);
router.post('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('roles.create'), [
    (0, express_validator_1.body)('name')
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
        .trim(),
    (0, express_validator_1.body)('permissions')
        .optional()
        .isObject().withMessage('Permissions must be an object')
], role_controller_1.createRole);
router.put('/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('roles.update'), [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid role ID'),
    (0, express_validator_1.body)('name')
        .optional()
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
        .trim(),
    (0, express_validator_1.body)('permissions')
        .optional()
        .isObject().withMessage('Permissions must be an object')
], role_controller_1.updateRole);
router.delete('/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('roles.delete'), [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid role ID')
], role_controller_1.deleteRole);
exports.default = router;
//# sourceMappingURL=role.routes.js.map