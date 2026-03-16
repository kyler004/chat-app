import prisma from '../lib/prisma.js';

export const updateDM = async (req, res) => {
  const { id } = req.params;
  const { description } = req.body;

  try {
    // Verify user is a participant
    const participant = await prisma.dmParticipant.findFirst({
      where: {
        conversationId: id,
        userId: req.user.id
      }
    });

    if (!participant) {
      return res.status(403).json({ error: 'You are not a participant in this conversation' });
    }

    const updatedDM = await prisma.dmConversation.update({
      where: { id },
      data: { description },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, avatar: true } }
          }
        }
      }
    });

    res.json({ conversation: updatedDM });
  } catch (error) {
    console.error('Error updating DM:', error);
    res.status(500).json({ error: 'Failed to update DM description' });
  }
};
