import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// 개발 중 핫리로드로 연결이 계속 늘어나지 않도록 재사용
const globalForDb = globalThis as unknown as { pool?: Pool };

const pool =
  globalForDb.pool ?? new Pool({ connectionString: process.env.DATABASE_URL });
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema });
export * as tables from "./schema";
