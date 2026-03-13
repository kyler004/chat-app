import { prisma } from '../lib/prisma.js';

export const updateProfile = async (req, res) => {
  const { username, avatar } = req.body;
  const userId = req.user.id;

  try {
    // Check if username is taken by another user
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: userId }
        }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username }),
        ...(avatar !== undefined && { avatar })
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        createdAt: true
      }
    });

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const getMe = async (req, res) => {
  res.json({ user: req.user });
};

export const searchUsers = async (req, res) => {
  const { q } = req.query;
  const userId = req.user.id;

  if (!q) {
    return res.json({ users: [] });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: q,
          mode: 'insensitive' // Optional, for case-insensitive search if supported (Postgres does)
        },
        NOT: { id: userId }
      },
      select: {
        id: true,
        username: true,
        avatar: true
      },
      take: 20 // Limit results
    });

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};

export const getMyDMs = async (req, res) => {
  const userId = req.user.id;
  try {
    const dms = await prisma.dMConversation.findMany({
      where: {
        participants: {
          some: { userId }
        }
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, avatar: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedDMs = dms.map(dm => {
      const otherUser = dm.participants.find(p => p.userId !== userId)?.user;
      return {
        ...dm,
        isDM: true,
        name: otherUser?.username || 'Unknown User',
        avatar: otherUser?.avatar
      };
    });

    res.json({ dms: formattedDMs });
  } catch (error) {
    console.error('Fetch DMs error:', error);
    res.status(500).json({ error: 'Failed to fetch DMs' });
  }
};
