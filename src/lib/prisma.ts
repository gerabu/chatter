import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { Pool } from "pg";

const connectionString =
  process.env.POSTGRES_PRISMA_URL;
if (!connectionString) {
  throw new Error("POSTGRES_PRISMA_URL is not set (required on Vercel)");
}

const globalForPrisma = globalThis as unknown as {
  chatterPool?: Pool;
  chatterPrisma?: PrismaClient;
};

function getPrisma(): PrismaClient {
  if (globalForPrisma.chatterPrisma) {
    return globalForPrisma.chatterPrisma;
  }
  const pool =
    globalForPrisma.chatterPool ??
    new Pool({
      connectionString,
    });
  globalForPrisma.chatterPool = pool;
  const client = new PrismaClient({ adapter: new PrismaPg(pool) });
  globalForPrisma.chatterPrisma = client;
  return client;
}

export const prisma = getPrisma();
