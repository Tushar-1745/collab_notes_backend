import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import noteRoutes from './routes/noteRoutes';
import userRoutes from './routes/userRoutes';
import { setupWebSocket } from './websocket/socket';

dotenv.config(); // Load environment variables

const app = express();
const server = http.createServer(app);

// ✅ Allowed Origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://real-time-collaborative-notes-app.vercel.app/' // 🔁 Replace with your actual Vercel frontend domain
];

// ✅ CORS Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/users', userRoutes);

// WebSocket setup
setupWebSocket(server);

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
