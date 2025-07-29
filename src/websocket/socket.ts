import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

let io: Server;

export const setupWebSocket = (server: HttpServer) => {
  io = new Server(server, {
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
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      (socket as any).user = decoded;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  // Track active users per note
  const activeUsers: Record<string, Set<string>> = {};

  // Track currently typing users per note
  const typingTimers: Record<string, Record<string, NodeJS.Timeout>> = {};

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    const email = user.email;

    console.log('🟢 Client connected:', socket.id, email);

    socket.on('join-note', (noteId: string) => {
      socket.join(noteId);

      // Add user to active users list
      if (!activeUsers[noteId]) activeUsers[noteId] = new Set();
      activeUsers[noteId].add(email);

      // Notify all users about the current active users
      io.to(noteId).emit('active-users', Array.from(activeUsers[noteId]));
    });

    socket.on('leave-note', (noteId: string) => {
      socket.leave(noteId);
      activeUsers[noteId]?.delete(email);
      io.to(noteId).emit('active-users', Array.from(activeUsers[noteId]));
    });

    socket.on('disconnecting', () => {
      const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
      rooms.forEach(room => {
        activeUsers[room]?.delete(email);
        io.to(room).emit('active-users', Array.from(activeUsers[room]));
      });
    });

    socket.on('disconnect', () => {
      console.log('🔴 Client disconnected:', socket.id);
    });

    // Note content update
    socket.on('note-update', ({ noteId, content }) => {
      socket.to(noteId).emit('note-update', { content });
    });

    // Note title update
    socket.on('note-title-update', ({ noteId, title }) => {
      socket.to(noteId).emit('note-title-update', { title });
    });

    // Cursor update
    socket.on('cursor-update', ({ noteId, email, cursorPosition }) => {
      if (
        typeof noteId === 'string' &&
        typeof email === 'string' &&
        typeof cursorPosition === 'number'
      ) {
        socket.to(noteId).emit('cursor-update', { email, cursorPosition });
      }
    });

    // Typing indicator
    socket.on('typing', ({ noteId }) => {
      if (!noteId) return;

      // Emit typing event to others
      socket.to(noteId).emit('user-typing', email);

      // Reset timer for debounce (clear previous if exists)
      if (!typingTimers[noteId]) typingTimers[noteId] = {};
      if (typingTimers[noteId][email]) {
        clearTimeout(typingTimers[noteId][email]);
      }

      // Emit stop typing after delay (e.g., 2 seconds)
      typingTimers[noteId][email] = setTimeout(() => {
        socket.to(noteId).emit('user-stop-typing', email);
        delete typingTimers[noteId][email];
      }, 2000);
    });
  });
};

export const getIO = (): Server => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
