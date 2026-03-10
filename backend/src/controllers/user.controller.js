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
