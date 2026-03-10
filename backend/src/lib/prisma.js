import dotenv from "dotenv";
dotenv.config();

import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Centralized pool and adapter for the whole application
function maskConnectionString(str) {
  try {
    const u = new URL(str);
    if (u.password) u.password = "*****";
    return u.toString();
  } catch (e) {
    return String(str).replace(/:[^@]+@/, ":*****@");
  }
}

const cs = process.env.DATABASE_URL;
if (!cs || typeof cs !== "string") {
  console.error("DATABASE_URL missing or not a string:", cs, typeof cs);
  throw new Error(
    "DATABASE_URL is missing or not a string. Check your .env or environment variables.",
  );
}

let pool;
try {
  pool = new pg.Pool({ connectionString: cs });
} catch (err) {
  console.error(
    "Failed to create pg.Pool with connection string (masked):",
    maskConnectionString(cs),
    err,
  );
  throw err;
}

const adapter = new PrismaPg(pool);

// Single PrismaClient instance
export const prisma = new PrismaClient({ adapter });

export default prisma;
