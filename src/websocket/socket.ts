import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import prisma from '../utils/prisma';

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

  // ✅ Authenticate and fetch user email
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication failed'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

      // Fetch email from DB
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { email: true },
      });

      if (!user) return next(new Error('User not found'));

      (socket as any).user = {
        id: decoded.userId,
        email: user.email,
      };

      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  const activeUsers: Record<string, Set<string>> = {};
  const typingTimers: Record<string, Record<string, NodeJS.Timeout>> = {};

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    const userId = user.id;
    const email = user.email;

    console.log('🟢 Client connected:', socket.id, email);

    socket.on('join-note', (noteId: string) => {
      socket.join(noteId);

      if (!activeUsers[noteId]) activeUsers[noteId] = new Set();
      activeUsers[noteId].add(email);

      // ✅ Notify others that a user has joined
      socket.to(noteId).emit('user-joined', {
        userId,
        userEmail: email,
      });

      io.to(noteId).emit('active-users', Array.from(activeUsers[noteId]));
    });

    socket.on('leave-note', (noteId: string) => {
      socket.leave(noteId);
      activeUsers[noteId]?.delete(email);

      // ✅ Notify others that a user has left
      socket.to(noteId).emit('user-left', {
        userId,
        userEmail: email,
      });

      io.to(noteId).emit('active-users', Array.from(activeUsers[noteId]));
    });

    socket.on('disconnecting', () => {
      const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
      rooms.forEach(room => {
        activeUsers[room]?.delete(email);

        // ✅ Notify others that a user has disconnected
        socket.to(room).emit('user-left', {
          userId,
          userEmail: email,
        });

        io.to(room).emit('active-users', Array.from(activeUsers[room]));
      });
    });

    socket.on('disconnect', () => {
      console.log('🔴 Client disconnected:', socket.id);
    });

    socket.on('note-update', ({ noteId, content }) => {
      socket.to(noteId).emit('note-update', { content });
    });

    socket.on('note-title-update', ({ noteId, title }) => {
      socket.to(noteId).emit('note-title-update', { title });
    });

    socket.on('cursor-update', ({ noteId, email, cursorPosition }) => {
      if (
        typeof noteId === 'string' &&
        typeof email === 'string' &&
        typeof cursorPosition === 'number'
      ) {
        socket.to(noteId).emit('cursor-update', { email, cursorPosition });
      }
    });

    socket.on('typing', ({ noteId }) => {
      if (!noteId) return;

      socket.to(noteId).emit('user-typing', email);

      if (!typingTimers[noteId]) typingTimers[noteId] = {};
      if (typingTimers[noteId][email]) clearTimeout(typingTimers[noteId][email]);

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
