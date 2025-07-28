"use strict";
// src/middleware/auth.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const auth_1 = require("../utils/auth");
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing or invalid token' });
    }
    const token = authHeader.split(' ')[1];
    if (!token || typeof token !== 'string') {
        return res.status(401).json({ message: 'Token must be a string' });
    }
    try {
        const payload = (0, auth_1.verifyToken)(token);
        req.user = { id: payload.userId };
        next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}
