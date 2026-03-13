import { prisma } from '../lib/prisma.js';

export const getInvites = async (req, res) => {
  try {
    const invites = await prisma.conversationInvite.findMany({
      where: {
        OR: [
          { senderId: req.user.id },
          { receiverId: req.user.id }
        ],
        status: 'PENDING'
      },
      include: {
        sender: {
          select: { id: true, username: true, avatar: true }
        },
        receiver: {
          select: { id: true, username: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ invites });
  } catch (error) {
    console.error('Error fetching invites:', error);
    res.status(500).json({ error: 'Failed to fetch invites' });
  }
};

export const sendInvite = async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.user.id;

  if (senderId === receiverId) {
    return res.status(400).json({ error: 'Cannot invite yourself' });
  }

  try {
    // Check if invite already exists between these two users (either direction)
    const existingInvite = await prisma.conversationInvite.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      }
    });

    if (existingInvite) {
      if (existingInvite.status === 'PENDING') {
        return res.status(400).json({ error: 'An invite is already pending between you' });
      } else if (existingInvite.status === 'ACCEPTED') {
        return res.status(400).json({ error: 'You are already connected' });
      } else {
        // If rejected, allow re-sending by creating a new one or updating the existing one
        const updatedInvite = await prisma.conversationInvite.update({
          where: { id: existingInvite.id },
          data: { status: 'PENDING', senderId, receiverId }
        });
        return res.json({ invite: updatedInvite });
      }
    }

    // Check if they are already in a DM together
    const existingDM = await prisma.dMConversation.findFirst({
      where: {
        participants: {
          every: {
            userId: { in: [senderId, receiverId] }
          }
        }
      }
    });

    if (existingDM) {
      return res.status(400).json({ error: 'You are already in a conversation with this user' });
    }

    const invite = await prisma.conversationInvite.create({
      data: { senderId, receiverId },
      include: {
        sender: { select: { id: true, username: true, avatar: true } },
        receiver: { select: { id: true, username: true, avatar: true } }
      }
    });

    res.status(201).json({ invite });
  } catch (error) {
    console.error('Error sending invite:', error);
    res.status(500).json({ error: 'Failed to send invite' });
  }
};

export const acceptInvite = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const invite = await prisma.conversationInvite.findUnique({
      where: { id }
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (invite.receiverId !== userId) {
      return res.status(403).json({ error: 'Not authorized to accept this invite' });
    }

    if (invite.status !== 'PENDING') {
      return res.status(400).json({ error: `Invite is already ${invite.status.toLowerCase()}` });
    }

    // Use a transaction: update invite and create DM conversation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update invite status
      const updatedInvite = await tx.conversationInvite.update({
        where: { id },
        data: { status: 'ACCEPTED' },
        include: {
          sender: { select: { id: true, username: true, avatar: true } },
          receiver: { select: { id: true, username: true, avatar: true } }
        }
      });

      // 2. See if existing conversation already somehow exists
      // In a strict design, maybe we just create it. But let's check just in case.
      let conversation = await tx.dMConversation.findFirst({
        where: {
          AND: [
            { participants: { some: { userId: invite.senderId } } },
            { participants: { some: { userId: invite.receiverId } } }
          ]
        },
        include: {
          participants: {
            include: { user: { select: { id: true, username: true, avatar: true } } }
          }
        }
      });

      if (!conversation) {
        // Create new
        conversation = await tx.dMConversation.create({
          data: {
            participants: {
              create: [
                { userId: invite.senderId },
                { userId: invite.receiverId }
              ]
            }
          },
          include: {
            participants: {
              include: { user: { select: { id: true, username: true, avatar: true } } }
            }
          }
        });
      }

      // Format the conversation object to match room structure for the frontend
      const otherUser = conversation.participants.find(p => p.userId !== userId)?.user;
      
      const formattedConversation = {
        ...conversation,
        isDM: true,
        name: otherUser?.username || 'Unknown User',
        avatar: otherUser?.avatar
      };

      return { invite: updatedInvite, conversation: formattedConversation };
    });

    res.json(result);
  } catch (error) {
    console.error('Error accepting invite:', error);
    res.status(500).json({ error: 'Failed to accept invite' });
  }
};

export const rejectInvite = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const invite = await prisma.conversationInvite.findUnique({
      where: { id }
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (invite.receiverId !== userId) {
      return res.status(403).json({ error: 'Not authorized to reject this invite' });
    }

    if (invite.status !== 'PENDING') {
      return res.status(400).json({ error: `Invite is already ${invite.status.toLowerCase()}` });
    }

    const updatedInvite = await prisma.conversationInvite.update({
      where: { id },
      data: { status: 'REJECTED' }
    });

    res.json({ invite: updatedInvite });
  } catch (error) {
    console.error('Error rejecting invite:', error);
    res.status(500).json({ error: 'Failed to reject invite' });
  }
};
