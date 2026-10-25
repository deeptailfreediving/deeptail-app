import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Neon은 마이그레이션에 직접 연결(UNPOOLED) 주소를 쓰는 게 안전함
  dbCredentials: { url: (process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL)! },
});
