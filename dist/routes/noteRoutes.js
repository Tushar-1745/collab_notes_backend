"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const noteController_1 = require("../controllers/noteController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const noteRoutes = express_1.default.Router();
noteRoutes.get('/', authMiddleware_1.authenticate, noteController_1.getNotes);
noteRoutes.post('/create', authMiddleware_1.authenticate, noteController_1.createNote);
noteRoutes.delete('/:id', authMiddleware_1.authenticate, noteController_1.deleteNote);
noteRoutes.get('/:id/snapshots', authMiddleware_1.authenticate, noteController_1.getNoteSnapshots);
noteRoutes.put('/:id', authMiddleware_1.authenticate, noteController_1.updateNote);
noteRoutes.get("/:id", authMiddleware_1.authenticate, noteController_1.getNoteByIdHandler);
exports.default = noteRoutes;
