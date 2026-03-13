import { prisma } from '../lib/prisma.js';

export const getRooms = async (req, res) => {
  try {
    // Return only rooms the user is a member of
    const rooms = await prisma.room.findMany({
      where: {
        members: {
          some: { userId: req.user.id }
        }
      },
      include: {
        _count: {
          select: { members: true }
        },
        members: {
          where: { userId: req.user.id },
          select: { role: true }
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
          create: { 
            userId: req.user.id,
            role: 'ADMIN' // Creator is the Admin
          }
        }
      },
      include: {
        _count: { select: { members: true } },
        members: {
          where: { userId: req.user.id },
          select: { role: true }
        }
      }
    });
    res.status(201).json({ room });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
};

export const addMember = async (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.body;

  try {
    // 1. Check if the requester is an ADMIN of this room
    const requester = await prisma.roomMember.findFirst({
      where: { roomId, userId: req.user.id }
    });

    if (!requester || requester.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can add members' });
    }

    // 2. Add the member
    const newMember = await prisma.roomMember.create({
      data: { roomId, userId, role: 'MEMBER' },
      include: { user: { select: { id: true, username: true, avatar: true } } }
    });

    res.status(201).json({ message: 'User added to room', member: newMember });
  } catch (error) {
    console.error('Error adding member:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'User is already a member of this room' });
    }
    res.status(500).json({ error: 'Failed to add member' });
  }
};

export const removeMember = async (req, res) => {
  const { roomId, userId } = req.params;

  try {
    // 1. Check if the requester is an ADMIN of this room
    const requester = await prisma.roomMember.findFirst({
      where: { roomId, userId: req.user.id }
    });

    if (!requester || requester.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can remove members' });
    }

    // 2. Remove the member
    await prisma.roomMember.deleteMany({
      where: { roomId, userId }
    });

    res.json({ message: 'User removed from room' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};

export const getMemberStatus = async (req, res) => {
  const { roomId } = req.params;
  try {
    const members = await prisma.roomMember.findMany({
      where: { roomId },
      include: { user: { select: { id: true, username: true, avatar: true } } }
    });
    res.json({ members });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch members' });
  }
};
