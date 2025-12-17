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
const order_controller_1 = require("../controllers/order.controller");
const router = express_1.default.Router();
router.use(auth_middleware_1.authenticate);
router.get('/stats', (0, rbac_middleware_1.requirePermission)('orders.read'), order_controller_1.getOrderStats);
router.get('/', (0, rbac_middleware_1.requirePermission)('orders.read'), [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['pending_approval', 'prepared', 'completed', 'cancelled'])
        .withMessage('Invalid status'),
    (0, express_validator_1.query)('userId')
        .optional()
        .isUUID()
        .withMessage('User ID must be a valid UUID'),
    validation_middleware_1.handleValidationErrors,
], order_controller_1.getOrders);
router.get('/:id', (0, rbac_middleware_1.requirePermission)('orders.read'), [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Order ID must be a valid UUID'),
    validation_middleware_1.handleValidationErrors,
], order_controller_1.getOrderById);
router.post('/', (0, rbac_middleware_1.requirePermission)('orders.create'), [
    (0, express_validator_1.body)('userId')
        .optional()
        .isUUID()
        .withMessage('User ID must be a valid UUID'),
    (0, express_validator_1.body)('items')
        .isArray({ min: 1 })
        .withMessage('Items must be a non-empty array'),
    (0, express_validator_1.body)('items.*.productId')
        .isUUID()
        .withMessage('Product ID must be a valid UUID'),
    (0, express_validator_1.body)('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1'),
    (0, express_validator_1.body)('notes')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Notes must be at most 500 characters'),
    validation_middleware_1.handleValidationErrors,
], order_controller_1.createOrder);
router.patch('/:id/status', (0, rbac_middleware_1.requirePermission)('orders.update'), [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Order ID must be a valid UUID'),
    (0, express_validator_1.body)('status')
        .isIn(['pending_approval', 'prepared', 'completed', 'cancelled'])
        .withMessage('Status must be one of: pending_approval, prepared, completed, cancelled'),
    validation_middleware_1.handleValidationErrors,
], order_controller_1.updateOrderStatus);
router.delete('/:id', (0, rbac_middleware_1.requirePermission)('orders.delete'), [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Order ID must be a valid UUID'),
    validation_middleware_1.handleValidationErrors,
], order_controller_1.deleteOrder);
exports.default = router;
//# sourceMappingURL=order.routes.js.map