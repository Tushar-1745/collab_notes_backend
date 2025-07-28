"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNoteByIdHandler = exports.updateNote = exports.getNoteSnapshots = exports.deleteNote = exports.createNote = exports.getNotes = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getNotes = async (req, res) => {
    const userId = req.user?.id;
    try {
        const notes = await prisma_1.default.note.findMany({
            where: {
                OR: [
                    { ownerId: userId },
                    { collaborators: { some: { userId } } },
                ],
            },
            include: {
                collaborators: true,
            },
            orderBy: { updatedAt: 'desc' },
        });
        res.json({ notes });
    }
    catch (err) {
        console.error("Error fetching notes:", err);
        res.status(500).json({ message: 'Failed to fetch notes' });
    }
};
exports.getNotes = getNotes;
const createNote = async (req, res) => {
    const userId = req.user?.id;
    const { title, content, collaborators } = req.body;
    try {
        // 🔍 Find valid user IDs for collaborator emails
        const collaboratorUsers = await prisma_1.default.user.findMany({
            where: {
                email: {
                    in: collaborators.map((c) => c.user.email),
                },
            },
        });
        // 🧠 Convert found users to [{ userId: string }]
        const collaboratorData = collaboratorUsers.map(user => ({
            userId: user.id,
        }));
        const newNote = await prisma_1.default.note.create({
            data: {
                title,
                content,
                ownerId: userId, // tells TypeScript it's not undefined
                collaborators: {
                    create: collaboratorData,
                },
            },
            include: {
                collaborators: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        res.status(200).json({ note: newNote });
    }
    catch (err) {
        console.error('Error creating note:', err);
        res.status(500).json({ message: 'Failed to create note' });
    }
};
exports.createNote = createNote;
const deleteNote = async (req, res) => {
    const noteId = req.params.id;
    const userId = req.user?.id;
    try {
        const note = await prisma_1.default.note.findUnique({
            where: { id: noteId },
        });
        if (!note || note.ownerId !== userId) {
            return res.status(403).json({ message: 'Unauthorized to delete this note' });
        }
        await prisma_1.default.note.delete({
            where: { id: noteId },
        });
        res.json({ message: 'Note deleted successfully' });
    }
    catch (err) {
        console.error("Error deleting note:", err);
        res.status(500).json({ message: 'Failed to delete note' });
    }
};
exports.deleteNote = deleteNote;
const getNoteSnapshots = async (req, res) => {
    const { id: noteId } = req.params;
    const userId = req.user?.id;
    try {
        // Optional: check access control
        const note = await prisma_1.default.note.findUnique({
            where: { id: noteId },
            include: { collaborators: true },
        });
        if (!note || (note.ownerId !== userId && !note.collaborators.some(c => c.userId === userId))) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const snapshots = await prisma_1.default.noteSnapshot.findMany({
            where: { noteId },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ snapshots });
    }
    catch (err) {
        console.error("Error fetching snapshots:", err);
        res.status(500).json({ message: "Failed to fetch snapshots" });
    }
};
exports.getNoteSnapshots = getNoteSnapshots;
const updateNote = async (req, res) => {
    const noteId = req.params.id;
    const userId = req.user?.id;
    const { title, content, collaborators } = req.body;
    try {
        const note = await prisma_1.default.note.findUnique({
            where: { id: noteId },
            include: { collaborators: true },
        });
        if (!note ||
            (note.ownerId !== userId && !note.collaborators.some((c) => c.userId === userId))) {
            return res.status(403).json({ message: "Unauthorized" });
        }
        if (note.ownerId === userId) {
            // Owner can update everything, including collaborators
            const collaboratorUsers = await prisma_1.default.user.findMany({
                where: {
                    email: {
                        in: collaborators.map((c) => c.user.email),
                    },
                },
            });
            const collaboratorData = collaboratorUsers.map((user) => ({
                userId: user.id,
            }));
            await prisma_1.default.note.update({
                where: { id: noteId },
                data: {
                    title,
                    content,
                    collaborators: {
                        deleteMany: {}, // clear all
                        create: collaboratorData,
                    },
                },
            });
        }
        else {
            // Collaborator can only update title & content
            await prisma_1.default.note.update({
                where: { id: noteId },
                data: {
                    title,
                    content,
                },
            });
        }
        // ✅ Save snapshot after update
        await prisma_1.default.noteSnapshot.create({
            data: {
                noteId,
                title,
                content,
            },
        });
        res.json({ message: "Note updated and snapshot created successfully" });
    }
    catch (err) {
        console.error("Error updating note:", err);
        res.status(500).json({ message: "Failed to update note" });
    }
};
exports.updateNote = updateNote;
// controllers/noteController.ts
// 🔹 Get single note by ID
const getNoteByIdHandler = async (req, res) => {
    try {
        const noteId = req.params.id;
        const userId = req.user?.id;
        const note = await prisma_1.default.note.findUnique({
            where: { id: noteId },
            include: {
                owner: { select: { email: true } },
                collaborators: { include: { user: { select: { email: true } } } },
            },
        });
        if (!note) {
            return res.status(404).json({ message: "Note not found" });
        }
        const isOwner = note.ownerId === userId;
        const isCollaborator = note.collaborators.some((c) => c.userId === userId);
        if (!isOwner && !isCollaborator) {
            return res.status(403).json({ message: "Forbidden" });
        }
        res.status(200).json({ note });
    }
    catch (err) {
        console.error("Error fetching note by ID:", err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.getNoteByIdHandler = getNoteByIdHandler;
