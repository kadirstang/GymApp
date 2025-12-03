"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController = __importStar(require("../controllers/user.controller"));
const authMiddleware = __importStar(require("../middleware/auth.middleware"));
const rbacMiddleware = __importStar(require("../middleware/rbac.middleware"));
const gymIsolationMiddleware = __importStar(require("../middleware/gymIsolation.middleware"));
const express_validator_1 = require("express-validator");
const validate = require('../middleware/validate');
const router = (0, express_1.Router)();
router.use(authMiddleware.authenticate);
router.get('/', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('role').optional().isString(),
    (0, express_validator_1.query)('search').optional().isString(),
    validate,
], gymIsolationMiddleware.enforceGymIsolation, rbacMiddleware.requirePermission('users.read'), userController.getUsers);
router.get('/:id', gymIsolationMiddleware.verifySameGymUser('id'), userController.getUserById);
router.put('/:id', [
    (0, express_validator_1.body)('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    (0, express_validator_1.body)('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    (0, express_validator_1.body)('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
    (0, express_validator_1.body)('email').optional().isEmail().withMessage('Invalid email'),
    (0, express_validator_1.body)('avatarUrl').optional().isURL().withMessage('Invalid avatar URL'),
    (0, express_validator_1.body)('birthDate').optional().isISO8601().withMessage('Invalid birth date'),
    (0, express_validator_1.body)('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
    (0, express_validator_1.body)('roleId').optional().isUUID().withMessage('Invalid role ID'),
    validate,
], gymIsolationMiddleware.verifySameGymUser('id'), userController.updateUser);
router.put('/:id/password', [
    (0, express_validator_1.body)('currentPassword').notEmpty().withMessage('Current password is required'),
    (0, express_validator_1.body)('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters'),
    validate,
], userController.changePassword);
router.delete('/:id', gymIsolationMiddleware.verifySameGymUser('id'), rbacMiddleware.requirePermission('users.delete'), userController.deleteUser);
router.get('/:id/measurements', [
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validate,
], gymIsolationMiddleware.verifySameGymUser('id'), userController.getUserMeasurements);
router.post('/:id/measurements', [
    (0, express_validator_1.body)('weight').optional().isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
    (0, express_validator_1.body)('height').optional().isFloat({ min: 0 }).withMessage('Height must be a positive number'),
    (0, express_validator_1.body)('bodyFatPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Body fat percentage must be between 0 and 100'),
    (0, express_validator_1.body)('muscleMass').optional().isFloat({ min: 0 }).withMessage('Muscle mass must be a positive number'),
    validate,
], gymIsolationMiddleware.verifySameGymUser('id'), userController.addUserMeasurement);
router.put('/:userId/measurements/:measurementId', [
    (0, express_validator_1.body)('weight').optional().isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
    (0, express_validator_1.body)('height').optional().isFloat({ min: 0 }).withMessage('Height must be a positive number'),
    (0, express_validator_1.body)('bodyFatPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Body fat percentage must be between 0 and 100'),
    (0, express_validator_1.body)('muscleMass').optional().isFloat({ min: 0 }).withMessage('Muscle mass must be a positive number'),
    validate,
], gymIsolationMiddleware.verifySameGymUser('userId'), userController.updateUserMeasurement);
router.delete('/:userId/measurements/:measurementId', gymIsolationMiddleware.verifySameGymUser('userId'), userController.deleteUserMeasurement);
const avatarController = __importStar(require("../controllers/avatar.controller"));
const upload_middleware_1 = require("../middleware/upload.middleware");
router.post('/:id/avatar', gymIsolationMiddleware.verifySameGymUser('id'), upload_middleware_1.avatarUpload.single('avatar'), avatarController.uploadAvatar);
router.delete('/:id/avatar', gymIsolationMiddleware.verifySameGymUser('id'), avatarController.deleteUserAvatar);
exports.default = router;
//# sourceMappingURL=user.routes.js.map