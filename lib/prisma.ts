import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";

function createPrismaClient() {
  const sqlite = new Database(process.env.DATABASE_URL?.replace("file:", "") ?? "./dev.db");
  const adapter = new PrismaBetterSQLite3(sqlite);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
