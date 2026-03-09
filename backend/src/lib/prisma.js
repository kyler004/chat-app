import dotenv from "dotenv";
dotenv.config();

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Centralized pool and adapter for the whole application
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Single PrismaClient instance
export const prisma = new PrismaClient({ adapter });

export default prisma;
