import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../../types/express';

interface Collaborator {
  userId: string;
}

interface User {
  id: string;
  email: string;
}

export const getNotes = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;

  try {
    const notes = await prisma.note.findMany({
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
  } catch (err) {
    console.error("Error fetching notes:", err);
    res.status(500).json({ message: 'Failed to fetch notes' });
  }
};

export const createNote = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { title, content, collaborators } = req.body;

  try {
    // const collaboratorUsers = await prisma.user.findMany({
    //   where: {
    //     email: {
    //       in: collaborators.map((c: any) => c.user.email),
    //     },
    //   },
    // });
    if (!Array.isArray(collaborators)) {
      return res.status(400).json({ message: "Collaborators must be an array" });
    }
    
    const collaboratorEmails = collaborators
      .map((c: any) => c?.user?.email)
      .filter((email: string | undefined) => typeof email === "string");
    
    if (collaboratorEmails.length === 0) {
      return res.status(400).json({ message: "No valid collaborator emails provided" });
    }
    
    const collaboratorUsers = await prisma.user.findMany({
      where: {
        email: {
          in: collaboratorEmails,
        },
      },
    });
    

    const collaboratorData = collaboratorUsers.map((user: User) => ({
      userId: user.id,
    }));

    const newNote = await prisma.note.create({
      data: {
        title,
        content,
        ownerId: userId!,
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
  } catch (err) {
    console.error('Error creating note:', err);
    res.status(500).json({ message: 'Failed to create note' });
  }
};

export const deleteNote = async (req: AuthenticatedRequest, res: Response) => {
  const noteId = req.params.id;
  const userId = req.user?.id;

  try {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note || note.ownerId !== userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this note' });
    }

    // ✅ Delete related collaborators
    await prisma.noteCollaborator.deleteMany({
      where: { noteId },
    });

    // ✅ Delete related snapshots
    await prisma.noteSnapshot.deleteMany({
      where: { noteId },
    });

    // ✅ Now delete the note
    await prisma.note.delete({
      where: { id: noteId },
    });

    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error("Error deleting note:", err);
    res.status(500).json({ message: 'Failed to delete note' });
  }
};

export const getNoteSnapshots = async (req: AuthenticatedRequest, res: Response) => {
  const { id: noteId } = req.params;
  const userId = req.user?.id;

  try {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: { collaborators: true },
    });

    if (!note || (note.ownerId !== userId && !note.collaborators.some((c: Collaborator) => c.userId === userId))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const snapshots = await prisma.noteSnapshot.findMany({
      where: { noteId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ snapshots });
  } catch (err) {
    console.error("Error fetching snapshots:", err);
    res.status(500).json({ message: "Failed to fetch snapshots" });
  }
};

export const updateNote = async (req: AuthenticatedRequest, res: Response) => {
  const noteId = req.params.id;
  const userId = req.user?.id;
  const { title, content, collaborators } = req.body;

  try {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: { collaborators: true },
    });

    if (!note || (note.ownerId !== userId && !note.collaborators.some((c: Collaborator) => c.userId === userId))) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (note.ownerId === userId) {
      const collaboratorUsers = await prisma.user.findMany({
        where: {
          email: {
            in: collaborators.map((c: any) => c.user.email),
          },
        },
      });

      const collaboratorData = collaboratorUsers.map((user: User) => ({
        userId: user.id,
      }));

      await prisma.note.update({
        where: { id: noteId },
        data: {
          title,
          content,
          collaborators: {
            deleteMany: {},
            create: collaboratorData,
          },
        },
      });
    } else {
      await prisma.note.update({
        where: { id: noteId },
        data: {
          title,
          content,
        },
      });
    }

    await prisma.noteSnapshot.create({
      data: {
        noteId,
        title,
        content,
      },
    });

    res.json({ message: "Note updated and snapshot created successfully" });
  } catch (err) {
    console.error("Error updating note:", err);
    res.status(500).json({ message: "Failed to update note" });
  }
};

export const getNoteByIdHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const noteId = req.params.id;
    const userId = req.user?.id;

    const note = await prisma.note.findUnique({
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
    const isCollaborator = note.collaborators.some((c: Collaborator) => c.userId === userId);

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.status(200).json({ note });
  } catch (err) {
    console.error("Error fetching note by ID:", err);
    res.status(500).json({ message: "Server error" });
  }
};
