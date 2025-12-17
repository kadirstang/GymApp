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
const equipment_controller_1 = require("../controllers/equipment.controller");
const router = express_1.default.Router();
router.use(auth_middleware_1.authenticate);
router.get('/stats', (0, rbac_middleware_1.requirePermission)('equipment.read'), equipment_controller_1.getEquipmentStats);
router.get('/:id/qr-code', (0, rbac_middleware_1.requirePermission)('equipment.read'), [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Equipment ID must be a valid UUID'),
    validation_middleware_1.handleValidationErrors,
], equipment_controller_1.generateQRCode);
router.get('/qr/:qrCodeUuid', (0, rbac_middleware_1.requirePermission)('equipment.read'), [
    (0, express_validator_1.param)('qrCodeUuid')
        .isUUID()
        .withMessage('QR code UUID must be a valid UUID'),
    validation_middleware_1.handleValidationErrors,
], equipment_controller_1.getEquipmentByQR);
router.get('/', (0, rbac_middleware_1.requirePermission)('equipment.read'), [
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
        .trim()
        .isLength({ max: 100 })
        .withMessage('Search must be at most 100 characters'),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['active', 'maintenance', 'broken'])
        .withMessage('Status must be active, maintenance, or broken'),
    validation_middleware_1.handleValidationErrors,
], equipment_controller_1.getEquipment);
router.get('/:id', (0, rbac_middleware_1.requirePermission)('equipment.read'), [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Equipment ID must be a valid UUID'),
    validation_middleware_1.handleValidationErrors,
], equipment_controller_1.getEquipmentById);
router.post('/', (0, rbac_middleware_1.requirePermission)('equipment.create'), [
    (0, express_validator_1.body)('name')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ max: 100 })
        .withMessage('Name must be at most 100 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must be at most 1000 characters'),
    (0, express_validator_1.body)('videoUrl')
        .optional()
        .isString()
        .trim()
        .isURL()
        .withMessage('Video URL must be a valid URL'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['active', 'maintenance', 'broken'])
        .withMessage('Status must be active, maintenance, or broken'),
    validation_middleware_1.handleValidationErrors,
], equipment_controller_1.createEquipment);
router.put('/:id', (0, rbac_middleware_1.requirePermission)('equipment.update'), [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Equipment ID must be a valid UUID'),
    (0, express_validator_1.body)('name')
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Name cannot be empty')
        .isLength({ max: 100 })
        .withMessage('Name must be at most 100 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must be at most 1000 characters'),
    (0, express_validator_1.body)('videoUrl')
        .optional()
        .isString()
        .trim()
        .isURL()
        .withMessage('Video URL must be a valid URL'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['active', 'maintenance', 'broken'])
        .withMessage('Status must be active, maintenance, or broken'),
    validation_middleware_1.handleValidationErrors,
], equipment_controller_1.updateEquipment);
router.delete('/:id', (0, rbac_middleware_1.requirePermission)('equipment.delete'), [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Equipment ID must be a valid UUID'),
    validation_middleware_1.handleValidationErrors,
], equipment_controller_1.deleteEquipment);
exports.default = router;
//# sourceMappingURL=equipment.routes.js.map