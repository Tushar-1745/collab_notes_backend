import express from 'express';
import { getNotes, deleteNote, createNote, getNoteSnapshots, updateNote, getNoteByIdHandler} from '../controllers/noteController';
import { authenticate } from '../middleware/authMiddleware';

const noteRoutes = express.Router();

noteRoutes.get('/', authenticate, getNotes);
noteRoutes.post('/create', authenticate, createNote);
noteRoutes.delete('/:id', authenticate, deleteNote);
noteRoutes.get('/:id/snapshots', authenticate, getNoteSnapshots);
noteRoutes.put('/:id', authenticate, updateNote);
noteRoutes.get("/:id", authenticate, getNoteByIdHandler);


export default noteRoutes;
