import { prisma } from '../lib/prisma.js';
import {
  getCachedMessages,
  setCachedMessages,
  CACHE_KEYS,
} from "../services/redis.service.js";

export const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const cacheKey = CACHE_KEYS.roomMessages(roomId);

    // Try cache first
    const cached = await getCachedMessages(cacheKey);
    if (cached) {
      console.log(`Cache HIT for room ${roomId}`);
      return res.json({ message: cached, fromCache: true });
    }

    // Cache miss, get from database
    console.log(`cache MISS for room ${roomId}`);
    const messages = await prisma.message.findMany({
      where: { roomId },
      include: {
        sender: {
          select: { id: true, username: true, avatar: true },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 50, //Always paginate, never fetch unbounded data
    });

    // Store in cache for next time
    await setCachedMessages(cacheKey, messages);

    res.json({ messages, fromCache: false });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
