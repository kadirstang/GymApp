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
const product_controller_1 = require("../controllers/product.controller");
const router = express_1.default.Router();
router.use(auth_middleware_1.authenticate);
router.get('/stats', (0, rbac_middleware_1.requirePermission)('products.read'), product_controller_1.getProductStats);
router.get('/', (0, rbac_middleware_1.requirePermission)('products.read'), [
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
    (0, express_validator_1.query)('categoryId')
        .optional()
        .isUUID()
        .withMessage('Category ID must be a valid UUID'),
    (0, express_validator_1.query)('isActive')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('isActive must be true or false'),
    (0, express_validator_1.query)('inStock')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('inStock must be true or false'),
    validation_middleware_1.handleValidationErrors,
], product_controller_1.getProducts);
router.get('/:id', (0, rbac_middleware_1.requirePermission)('products.read'), [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Product ID must be a valid UUID'),
    validation_middleware_1.handleValidationErrors,
], product_controller_1.getProductById);
router.post('/', (0, rbac_middleware_1.requirePermission)('products.create'), [
    (0, express_validator_1.body)('categoryId')
        .isUUID()
        .withMessage('Category ID must be a valid UUID'),
    (0, express_validator_1.body)('name')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ max: 200 })
        .withMessage('Name must be at most 200 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description must be at most 2000 characters'),
    (0, express_validator_1.body)('imageUrl')
        .optional({ values: 'falsy' })
        .isString()
        .trim()
        .isURL()
        .withMessage('Image URL must be a valid URL'),
    (0, express_validator_1.body)('price')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    (0, express_validator_1.body)('stockQuantity')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Stock quantity must be a non-negative integer'),
    (0, express_validator_1.body)('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),
    validation_middleware_1.handleValidationErrors,
], product_controller_1.createProduct);
router.put('/:id', (0, rbac_middleware_1.requirePermission)('products.update'), [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Product ID must be a valid UUID'),
    (0, express_validator_1.body)('categoryId')
        .optional()
        .isUUID()
        .withMessage('Category ID must be a valid UUID'),
    (0, express_validator_1.body)('name')
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Name cannot be empty')
        .isLength({ max: 200 })
        .withMessage('Name must be at most 200 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description must be at most 2000 characters'),
    (0, express_validator_1.body)('imageUrl')
        .optional({ values: 'falsy' })
        .isString()
        .trim()
        .isURL()
        .withMessage('Image URL must be a valid URL'),
    (0, express_validator_1.body)('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    (0, express_validator_1.body)('stockQuantity')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Stock quantity must be a non-negative integer'),
    (0, express_validator_1.body)('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),
    validation_middleware_1.handleValidationErrors,
], product_controller_1.updateProduct);
router.patch('/:id/stock', (0, rbac_middleware_1.requirePermission)('products.update'), [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Product ID must be a valid UUID'),
    (0, express_validator_1.body)('stockQuantity')
        .isInt({ min: 0 })
        .withMessage('Stock quantity must be a non-negative integer'),
    validation_middleware_1.handleValidationErrors,
], product_controller_1.updateStock);
router.patch('/:id/toggle', (0, rbac_middleware_1.requirePermission)('products.update'), [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Product ID must be a valid UUID'),
    validation_middleware_1.handleValidationErrors,
], product_controller_1.toggleActivation);
router.delete('/:id', (0, rbac_middleware_1.requirePermission)('products.delete'), [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Product ID must be a valid UUID'),
    validation_middleware_1.handleValidationErrors,
], product_controller_1.deleteProduct);
router.post('/:id/image', (0, rbac_middleware_1.requirePermission)('products.update'), [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Product ID must be a valid UUID'),
    validation_middleware_1.handleValidationErrors,
], upload_middleware_1.productImageUpload.single('image'), product_controller_1.uploadProductImage);
exports.default = router;
//# sourceMappingURL=product.routes.js.map