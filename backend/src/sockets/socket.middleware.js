import jwt from "jsonwebtoken";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

//This runs once when a client first connects via websockets
export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, avatar: true },
    });

    if (!user) {
      return next(new Error("User not found"));
    }

    //Attach user to the socket - available in all handlers
    socket.user = user;
    next(); //Allow connection
  } catch (error) {
    next(new Error("Invalid token")); //Reject connection
  }
};
