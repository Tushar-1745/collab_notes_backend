"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.setupWebSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let io;
const setupWebSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: [
                'http://localhost:3000',
                'https://real-time-collaborative-notes-app.vercel.app',
            ],
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    // Middleware: Authenticate socket via JWT
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error("Authentication failed"));
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        }
        catch (err) {
            next(new Error("Invalid token"));
        }
    });
    // Track active users per note
    const activeUsers = {};
    io.on('connection', (socket) => {
        const user = socket.user;
        const email = user.email;
        console.log('🟢 Client connected:', socket.id, email);
        socket.on('join-note', (noteId) => {
            socket.join(noteId);
            // Add to active users list
            if (!activeUsers[noteId])
                activeUsers[noteId] = new Set();
            activeUsers[noteId].add(email);
            // Notify all users in the room about active users
            io.to(noteId).emit('active-users', Array.from(activeUsers[noteId]));
        });
        socket.on('leave-note', (noteId) => {
            socket.leave(noteId);
            if (activeUsers[noteId]) {
                activeUsers[noteId].delete(email);
                io.to(noteId).emit('active-users', Array.from(activeUsers[noteId]));
            }
        });
        socket.on('disconnecting', () => {
            const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
            rooms.forEach(room => {
                activeUsers[room]?.delete(email);
                io.to(room).emit('active-users', Array.from(activeUsers[room]));
            });
        });
        // Note content update
        socket.on('note-update', ({ noteId, content }) => {
            socket.to(noteId).emit('note-update', { content });
        });
        // Note title update
        socket.on('note-title-update', ({ noteId, title }) => {
            socket.to(noteId).emit('note-title-update', { title });
        });
        // ✨ NEW: Cursor update event
        socket.on('cursor-update', ({ noteId, email, cursorPosition }) => {
            if (typeof noteId === 'string' &&
                typeof email === 'string' &&
                typeof cursorPosition === 'number') {
                socket.to(noteId).emit('cursor-update', { email, cursorPosition });
            }
            else {
                console.warn('Invalid cursor-update payload received:', {
                    noteId,
                    email,
                    cursorPosition,
                });
            }
        });
        socket.on('disconnect', () => {
            console.log('🔴 Client disconnected:', socket.id);
        });
    });
};
exports.setupWebSocket = setupWebSocket;
const getIO = () => {
    if (!io)
        throw new Error("Socket.io not initialized");
    return io;
};
exports.getIO = getIO;
