import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool__: Pool | undefined;
}

function createPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    max: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

export const pool = global.__pgPool__ || createPool();

if (process.env.NODE_ENV !== "production") {
  global.__pgPool__ = pool;
}
