import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const datasourceUrl =
  process.env.POSTGRES_PRISMA_URL ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  undefined;

if (!datasourceUrl) {
  throw new Error(
    "Set DATABASE_URL or POSTGRES_PRISMA_URL so Prisma can connect to Postgres."
  );
}

process.env.DATABASE_URL = datasourceUrl;
if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
  process.env.PRISMA_CLIENT_ENGINE_TYPE = "binary";
}

const globalForPrisma = globalThis as unknown as {
  prisma_v2?: PrismaClient;
  pgPool?: Pool;
};

const pool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString: datasourceUrl,
  });

const adapter = new PrismaPg(pool);

// Use a distinct global key to force a fresh instance if the schema changed
// but the dev server wasn't restarted.
const prismaClientSingleton = () => {
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
};

export const db = globalForPrisma.prisma_v2 ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma_v2 = db;
  globalForPrisma.pgPool = pool;
}

