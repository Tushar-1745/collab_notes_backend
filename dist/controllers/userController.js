"use strict";
// src/controllers/userController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkEmailExists = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const checkEmailExists = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    try {
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        res.json({ exists: !!user });
    }
    catch (err) {
        console.error("Error checking email:", err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.checkEmailExists = checkEmailExists;
