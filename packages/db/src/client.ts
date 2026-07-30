import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let cachedDb: ReturnType<typeof drizzle<typeof schema>> | undefined;

/**
 * Lazily creates a single pooled Postgres connection + Drizzle instance per
 * process. Reads `DATABASE_URL` at call time (not at module load) so tests
 * can run without a database configured until they actually need one.
 */
export function getDb() {
  if (cachedDb) return cachedDb;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. See packages/db/.env.example.");
  }

  const client = postgres(databaseUrl, { max: 1 });
  cachedDb = drizzle(client, { schema });
  return cachedDb;
}

export type Database = ReturnType<typeof getDb>;
export * as schema from "./schema";
