"use strict";
// 📄 src/routes/auth.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prismaClient_1 = require("../prismaClient");
const auth_1 = require("../utils/auth");
const router = express_1.default.Router();
router.post('/signup', async (req, res) => {
    const { name, email, password, mobile } = req.body;
    if (!name || !email || !password || !mobile)
        return res.status(400).json({ message: 'Missing fields' });
    const existingUser = await prismaClient_1.prisma.user.findUnique({ where: { email } });
    if (existingUser)
        return res.status(409).json({ message: 'User already exists' });
    const hashed = await (0, auth_1.hashPassword)(password);
    const user = await prismaClient_1.prisma.user.create({
        data: { name, email, password: hashed, mobile },
    });
    res.status(201).json({ message: 'User created', userId: user.id });
});
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await prismaClient_1.prisma.user.findUnique({ where: { email } });
    if (!user || !(await (0, auth_1.verifyPassword)(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = (0, auth_1.generateToken)(user.id);
    res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email, mobile: user.mobile } });
});
exports.default = router;
