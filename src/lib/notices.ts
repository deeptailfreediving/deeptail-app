import { desc, eq } from "drizzle-orm";
import { db, tables } from "@/db";

export const categoryLabel = { TOUR: "투어", EVENT: "행사", GENERAL: "공지" } as const;

export function listNotices(limit?: number) {
  const q = db
    .select()
    .from(tables.notices)
    .orderBy(desc(tables.notices.pinned), desc(tables.notices.publishedAt));
  return limit ? q.limit(limit) : q;
}

export async function getNotice(id: string) {
  const [n] = await db.select().from(tables.notices).where(eq(tables.notices.id, id));
  return n;
}

export const formatDate = (d: Date) =>
  new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", timeZone: "Asia/Seoul" }).format(d);
