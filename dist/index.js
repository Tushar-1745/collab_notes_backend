"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const noteRoutes_1 = __importDefault(require("./routes/noteRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const socket_1 = require("./websocket/socket");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Middleware
app.use((0, cors_1.default)({ origin: '*', credentials: true }));
app.use(express_1.default.json());
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/notes', noteRoutes_1.default); // ✅ Add this
app.use('/api/users', userRoutes_1.default); // ✅ Add this
// WebSocket setup
(0, socket_1.setupWebSocket)(server);
// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
