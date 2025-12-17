"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
const authenticate = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new errors_1.UnauthorizedError('No authorization token provided');
        }
        const token = (0, jwt_1.extractTokenFromHeader)(authHeader);
        if (!token) {
            throw new errors_1.UnauthorizedError('Invalid token format');
        }
        const payload = (0, jwt_1.verifyToken)(token);
        req.user = {
            userId: payload.userId,
            email: payload.email,
            gymId: payload.gymId,
            roleId: payload.roleId,
            role: payload.role,
        };
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
const optionalAuth = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = (0, jwt_1.extractTokenFromHeader)(authHeader);
            if (token) {
                const payload = (0, jwt_1.verifyToken)(token);
                req.user = {
                    userId: payload.userId,
                    email: payload.email,
                    gymId: payload.gymId,
                    roleId: payload.roleId,
                    role: payload.role,
                };
            }
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.middleware.js.map