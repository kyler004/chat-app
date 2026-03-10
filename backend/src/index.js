import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/messages.routes.js";
import roomRoutes from "./routes/room.routes.js";
import userRoutes from "./routes/user.routes.js";
import { socketAuthMiddleware } from "./sockets/socket.middleware.js";
import { registerSocketHandlers } from "./sockets/socket.handlers.js";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(morgan());
app.use(express.json());

// REST Routes
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/users", userRoutes);

// WebSocket — auth runs before any event handler
io.use(socketAuthMiddleware);
registerSocketHandlers(io);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
