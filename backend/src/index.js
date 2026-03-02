import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

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
app.get('/health', (req, res) => {
    res.json({status: 'ok', timestamp: new Date().toISOString() }); 
} ); 

//Routes to be added soon
//app.use('api/auth', authRoutes); 
//app.use("api/rooms", roomRoutes); 

//websocket handler (to be added soon too)
//registerSocketHandlers(io);

const PORT = process.env.PORT || 5000; 
httpServer.listen(PORT, () => {
    console.log(`Server running on ${PORT}`); 
}); 
