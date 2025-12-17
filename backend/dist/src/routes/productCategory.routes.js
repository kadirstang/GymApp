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
const productCategory_controller_1 = require("../controllers/productCategory.controller");
const router = express_1.default.Router();
router.use(auth_middleware_1.authenticate);
router.get('/', (0, rbac_middleware_1.requirePermission)('productCategories.read'), [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    validation_middleware_1.handleValidationErrors,
], productCategory_controller_1.getCategories);
router.get('/:id', (0, rbac_middleware_1.requirePermission)('productCategories.read'), [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Category ID must be a valid UUID'),
    validation_middleware_1.handleValidationErrors,
], productCategory_controller_1.getCategoryById);
router.post('/', (0, rbac_middleware_1.requirePermission)('productCategories.create'), [
    (0, express_validator_1.body)('name')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ max: 100 })
        .withMessage('Name must be at most 100 characters'),
    (0, express_validator_1.body)('imageUrl')
        .optional({ values: 'falsy' })
        .isString()
        .trim()
        .isURL()
        .withMessage('Image URL must be a valid URL'),
    validation_middleware_1.handleValidationErrors,
], productCategory_controller_1.createCategory);
router.put('/:id', (0, rbac_middleware_1.requirePermission)('productCategories.update'), [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Category ID must be a valid UUID'),
    (0, express_validator_1.body)('name')
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Name cannot be empty')
        .isLength({ max: 100 })
        .withMessage('Name must be at most 100 characters'),
    (0, express_validator_1.body)('imageUrl')
        .optional({ values: 'falsy' })
        .isString()
        .trim()
        .isURL()
        .withMessage('Image URL must be a valid URL'),
    validation_middleware_1.handleValidationErrors,
], productCategory_controller_1.updateCategory);
router.delete('/:id', (0, rbac_middleware_1.requirePermission)('productCategories.delete'), [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Category ID must be a valid UUID'),
    validation_middleware_1.handleValidationErrors,
], productCategory_controller_1.deleteCategory);
exports.default = router;
//# sourceMappingURL=productCategory.routes.js.map