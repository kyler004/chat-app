import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { invalidateCache, CACHE_KEYS } from "../services/redis.service.js";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log(`🟢 User connected: ${socket.user.username} [${socket.id}]`);

    // ROOM EVENTS

    //Client joins a chat room
    socket.on("room:join", async ({ roomId }) => {
      try {
        //verify user is a member of this room
        const membership = await prisma.roomMember.findUnique({
          where: {
            userId_roomId: {
              userId: socket.user.id,
              roomId,
            },
          },
        });

        if (!membership) {
          socket.emit("error", {
            message: "You are not a member of this room",
          });
          return;
        }

        //Join the Socket.io room (a named channel)
        socket.join(roomId);
        console.log(`${socket.user.username} joined room ${roomId}`);

        //Tell everyone else in the room this user arrived
        socket.to(roomId).emit("room:user_joined", {
          user: socket.user,
          roomId,
        });
      } catch (error) {
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // Client leaves a room
    socket.on("room:leave", ({ roomId }) => {
      socket.leave(roomId);
      socket.to(roomId).emit("room:user_left", {
        user: socket.user,
        roomId,
      });
    });

    //Client sends a message to a room
    socket.on("message:send_room", async ({ roomId, content }) => {
      try {
        if (!content?.trim()) return; // ignore all empty messages

        //Persist to database
        const message = await prisma.message.create({
          data: {
            content: content.trim(),
            senderId: socket.user.id,
            roomId,
          },
          include: {
            sender: {
              select: { id: true, username: true, avatar: true },
            },
          },
        });

        // Invalidate the cache - It's stale now
        await invalidateCache(CACHE_KEYS.roomMessages(roomId));

        //Broadcast to EVERYONE in the room (including sender)
        // io.to() vs socket.to():
        // - socket.to(room) = everyone EXCEPT the sender
        // - io.to(room) = everyone INCLUDING the sender
        io.to(roomId).emit("message:new", {
          message,
          roomId,
        });
      } catch (error) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // DIRECT MESSAGE EVENTS

    //Client joins a DM conversation
    socket.on("dm:join", async ({ conversationId }) => {
      try {
        //verify this user is part of this conversation
        const participant = await prisma.dMParticipant.findUnique({
          where: {
            userId_conversationId: {
              userId: socket.user.id,
              conversationId,
            },
          },
        });

        if (!participant) {
          socket.emit("error", { message: "Unauthorized" });
          return;
        }

        socket.join(`dm:${conversationId}`); // prefix to avoid Id collisions
        console.log(`${socket.user} joined DM ${conversationId}`);
      } catch (error) {
        socket.emit("error", { message: "Failed to join DM" });
      }
    });

    // Client sends a DM

    socket.on("message:send_dm", async ({ conversationId, content }) => {
      try {
        if (!content?.trim()) return;

        const message = await prisma.message.create({
          data: {
            content: content.trim(),
            senderId: socket.user.id,
            conversationId,
          },
          include: {
            sender: {
              select: { id: true, username: true, avatar: true },
            },
          },
        });

        await invalidateCache(CACHE_KEYS.dmMessages(conversationId));

        // Both participants are in this socket room
        io.to(`dm:${conversationId}`).emit("message:new", {
          message,
          conversationId,
        });
      } catch (error) {
        socket.emit("error", { message: "Failed to send DM" });
      }
    });

    //TYPING INDICATORS
    // Lightweight - no DB, just real-time presence

    socket.on("typing:start", ({ roomId }) => {
      socket.to(roomId).emit("typing:update", {
        user: socket.user,
        isTyping: false,
      });
    });

    // DISCONNECT

    socket.on("disconnect", (reason) => {
      console.log(`🔴 User disconnected: ${socket.user.username} — ${reason}`);
      // socket.io automatically removes the socket from all rooms on disconnect
    });
  });
};
