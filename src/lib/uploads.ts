// 앱에서 올린 사진 (자격증 · 후기 미리보기) — 휴대폰에서 미리 줄여서 DB에 저장
import { eq } from "drizzle-orm";
import { db, tables } from "@/db";

const MAX_BASE64 = 1_400_000; // 약 1MB

/** "data:image/jpeg;base64,..." → uploads 저장 후 id. 형식이 이상하면 null */
export async function saveUpload(kind: "LICENSE" | "REVIEW", dataUrl: string | undefined | null, userId?: string) {
  if (!dataUrl) return null;
  const m = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!m || m[2].length > MAX_BASE64) return null;
  const [row] = await db
    .insert(tables.uploads)
    .values({ kind, mime: m[1], data: m[2], userId: userId ?? null })
    .returning({ id: tables.uploads.id });
  return row.id;
}

export async function getUpload(id: string) {
  const [row] = await db.select().from(tables.uploads).where(eq(tables.uploads.id, id));
  return row ?? null;
}

export const uploadUrl = (id: string) => `/api/uploads/${id}`;
