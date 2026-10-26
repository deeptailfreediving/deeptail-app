// 관리자 화면에서 바꾸는 간단한 설정값 (app_settings 테이블)
import { eq } from "drizzle-orm";
import { db, tables } from "@/db";

export async function getSetting(key: string) {
  const [row] = await db.select().from(tables.appSettings).where(eq(tables.appSettings.key, key));
  return row?.value || null;
}

export async function setSetting(key: string, value: string) {
  if (!value) {
    await db.delete(tables.appSettings).where(eq(tables.appSettings.key, key));
    return;
  }
  await db
    .insert(tables.appSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: tables.appSettings.key, set: { value } });
}
