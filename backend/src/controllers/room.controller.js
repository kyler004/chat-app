import { prisma } from '../lib/prisma.js';

export const getRooms = async (req, res) => {
  try {
    // Return all rooms the user is a member of, or just all rooms for now
    // The frontend seems to expect a list of rooms. 
    // Usually in a chat app, you see rooms you are part of.
    // However, for this task, I'll return all rooms to ensure the "forums" are visible.
    
    const rooms = await prisma.room.findMany({
      include: {
        _count: {
          select: { members: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};

export const createRoom = async (req, res) => {
  const { name, description } = req.body;
  try {
    const room = await prisma.room.create({
      data: {
        name,
        description,
        members: {
          create: { userId: req.user.id } // Creator joins by default
        }
      }
    });
    res.status(201).json({ room });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create room' });
  }
};
