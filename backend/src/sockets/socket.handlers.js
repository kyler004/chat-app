import { prisma } from "../lib/prisma.js";
import { invalidateCache, CACHE_KEYS } from "../services/redis.service.js";

export const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log(`🟢 User connected: ${socket.user.username} [${socket.id}]`);

    // Add user to a personal room
    socket.join(`user:${socket.user.id}`);

    // ROOM EVENTS

    //Client joins a chat room
    socket.on("room:join", async ({ roomId }) => {
      try {
        // 1. Double check membership (Rooms are now private)
        const membership = await prisma.roomMember.findUnique({
          where: {
            userId_roomId: {
              userId: socket.user.id,
              roomId,
            },
          },
        });

        if (!membership) {
          socket.emit("error", { message: "You are not a member of this room" });
          return;
        }

        // Join the Socket.io room (a named channel)
        socket.join(roomId);
        console.log(`📡 ${socket.user.username} joined room ${roomId}`);

        // Tell everyone else in the room this user arrived
        socket.to(roomId).emit("room:user_joined", {
          user: socket.user,
          roomId,
        });
      } catch (error) {
        console.error("Join room error:", error);
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
        if (!content?.trim()) return; 

        // Double check membership before allowing send
        const membership = await prisma.roomMember.findUnique({
          where: { userId_roomId: { userId: socket.user.id, roomId } }
        });

        if (!membership) {
          socket.emit("error", { message: "You must join this room to send messages" });
          return;
        }

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

        // Invalidate the cache
        await invalidateCache(CACHE_KEYS.roomMessages(roomId));

        //Broadcast to EVERYONE in the room
        io.to(roomId).emit("message:new", {
          message,
          roomId,
        });
      } catch (error) {
        console.error("Send message error:", error);
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

        socket.join(`dm:${conversationId}`);
        console.log(`📡 ${socket.user.username} joined DM ${conversationId}`);
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

        io.to(`dm:${conversationId}`).emit("message:new", {
          message,
          conversationId,
        });
      } catch (error) {
        socket.emit("error", { message: "Failed to send DM" });
      }
    });

    //TYPING INDICATORS

    socket.on("typing:start", ({ roomId }) => {
      socket.to(roomId).emit("typing:update", {
        user: socket.user,
        isTyping: true,
      });
    });

    socket.on("typing:stop", ({ roomId }) => {
      socket.to(roomId).emit("typing:update", {
        user: socket.user,
        isTyping: false,
      });
    });

    socket.on("dm:typing:start", ({ conversationId }) => {
      socket.to(`dm:${conversationId}`).emit("typing:update", {
        user: socket.user,
        isTyping: true,
      });
    });

    socket.on("dm:typing:stop", ({ conversationId }) => {
      socket.to(`dm:${conversationId}`).emit("typing:update", {
        user: socket.user,
        isTyping: false,
      });
    });

    // INVITE EVENTS

    socket.on("invite:send", ({ receiverId, invite }) => {
      // Send to the receiver's personal room
      io.to(`user:${receiverId}`).emit("invite:received", { invite });
    });

    socket.on("invite:accept", ({ senderId, receiverId, conversation }) => {
      // Notify both the sender and the receiver about the new conversation
      io.to(`user:${senderId}`).emit("invite:accepted", { conversation });
      io.to(`user:${receiverId}`).emit("invite:accepted", { conversation });
    });

    // MEMBERSHIP EVENTS (For real-time Room list updates)

    socket.on("room:member_added", ({ roomId, userId, member, room }) => {
      // Notify the target user so they can add the room to their sidebar
      io.to(`user:${userId}`).emit("room:added", { room });
      
      // Notify everyone in the room there's a new person
      io.to(roomId).emit("room:user_joined", {
        user: member.user,
        roomId,
      });
    });

    socket.on("room:member_removed", ({ roomId, userId }) => {
      // Notify the target user so they can remove the room from their sidebar
      io.to(`user:${userId}`).emit("room:removed", { roomId });

      // Notify everyone else in the room
      io.to(roomId).emit("room:user_left", {
        userId,
        roomId,
      });
    });

    // METADATA UPDATES
    socket.on("room:update", ({ roomId, room }) => {
      // Broadcast to everyone in the room
      io.to(roomId).emit("room:updated", { room });
    });

    socket.on("dm:update", ({ conversationId, conversation }) => {
      // Broadcast to participants in the DM conversation
      io.to(`dm:${conversationId}`).emit("dm:updated", { conversation });
    });

    // DISCONNECT

    socket.on("disconnect", (reason) => {
      console.log(`🔴 User disconnected: ${socket.user.username} — ${reason}`);
    });
  });
};
