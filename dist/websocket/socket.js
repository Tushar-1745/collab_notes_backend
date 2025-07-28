"use strict";
// 📄 src/websocket/socket.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSocket = setupWebSocket;
const socket_io_1 = require("socket.io");
function setupWebSocket(server) {
    const io = new socket_io_1.Server(server, {
        cors: { origin: '*', methods: ['GET', 'POST'] },
    });
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
        socket.on('join-note', (noteId) => {
            socket.join(noteId);
        });
        socket.on('edit-note', ({ noteId, content }) => {
            socket.to(noteId).emit('note-updated', content);
        });
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
}
