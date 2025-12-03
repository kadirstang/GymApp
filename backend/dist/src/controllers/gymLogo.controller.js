"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGymLogo = exports.uploadGymLogo = void 0;
const client_1 = require("@prisma/client");
const response_js_1 = require("../utils/response.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
const uploadGymLogo = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const file = req.file;
        if (!file) {
            return (0, response_js_1.errorResponse)(res, 'No file uploaded', 400);
        }
        const where = {
            id,
            deletedAt: null
        };
        if (user.role !== 'SuperAdmin') {
            where.id = user.gymId;
        }
        const gym = await prisma.gym.findFirst({ where });
        if (!gym) {
            fs_1.default.unlinkSync(file.path);
            return (0, response_js_1.errorResponse)(res, 'Gym not found or unauthorized', 404);
        }
        if (gym.logoUrl) {
            const oldLogoPath = path_1.default.join(__dirname, '../..', gym.logoUrl);
            if (fs_1.default.existsSync(oldLogoPath)) {
                try {
                    fs_1.default.unlinkSync(oldLogoPath);
                }
                catch (error) {
                    console.error('Error deleting old logo:', error);
                }
            }
        }
        const logoUrl = `/uploads/gym-logos/${file.filename}`;
        const updatedGym = await prisma.gym.update({
            where: { id },
            data: { logoUrl }
        });
        return (0, response_js_1.successResponse)(res, updatedGym, 'Logo uploaded successfully');
    }
    catch (error) {
        console.error('Error uploading logo:', error);
        if (req.file) {
            fs_1.default.unlinkSync(req.file.path);
        }
        return (0, response_js_1.errorResponse)(res, 'Failed to upload logo', 500);
    }
};
exports.uploadGymLogo = uploadGymLogo;
const deleteGymLogo = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const where = {
            id,
            deletedAt: null
        };
        if (user.role !== 'SuperAdmin') {
            where.id = user.gymId;
        }
        const gym = await prisma.gym.findFirst({ where });
        if (!gym) {
            return (0, response_js_1.errorResponse)(res, 'Gym not found or unauthorized', 404);
        }
        if (!gym.logoUrl) {
            return (0, response_js_1.errorResponse)(res, 'No logo to delete', 400);
        }
        const logoPath = path_1.default.join(__dirname, '../..', gym.logoUrl);
        if (fs_1.default.existsSync(logoPath)) {
            try {
                fs_1.default.unlinkSync(logoPath);
            }
            catch (error) {
                console.error('Error deleting logo file:', error);
            }
        }
        const updatedGym = await prisma.gym.update({
            where: { id },
            data: { logoUrl: null }
        });
        return (0, response_js_1.successResponse)(res, updatedGym, 'Logo deleted successfully');
    }
    catch (error) {
        console.error('Error deleting logo:', error);
        return (0, response_js_1.errorResponse)(res, 'Failed to delete logo', 500);
    }
};
exports.deleteGymLogo = deleteGymLogo;
//# sourceMappingURL=gymLogo.controller.js.map