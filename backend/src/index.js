import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import messagesRoutes from "./routes/messages.routes";
import { socketAuthMiddleware } from "./sockets/socket.middleware";
import { registerSocketHandlers } from "./sockets/socket.handlers";

dotenv.config();

const app = express();
const httpServer = createServer(app); //Socket.io needs the raw HTTP server

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

//Middleware
app.use(cors());
app.use(express.json());

//Health check - base Route
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.use("/api/auth", authRoutes);
app.use("/api/messages", messagesRoutes);

//app.use("api/rooms", roomRoutes);

//websocket - Auth runs before any event handler
io.use(socketAuthMiddleware);
registerSocketHandlers(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});

export { io }; // Neede for socket handlers
