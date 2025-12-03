"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheckTS = void 0;
const healthCheckTS = async (_req, res, next) => {
    try {
        const response = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV,
            typescript: true,
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
};
exports.healthCheckTS = healthCheckTS;
//# sourceMappingURL=example.controller.js.map