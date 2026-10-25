// 노션 강습영상 피드백이 새로 쓰이거나 바뀌면 연결된 교육생에게 푸시
import { createHash } from "crypto";
import { eq, inArray } from "drizzle-orm";
import { db, tables } from "@/db";
import { normId, type VideoEntry } from "./notion";
import { sendPush } from "./push";

const hash = (s: string) => createHash("sha256").update(s.trim()).digest("hex").slice(0, 32);

/**
 * 피드백이 비어 있지 않고, 마지막으로 알린 내용과 다르면 알림.
 * 처음 연동할 때 기존 영상들로 알림이 쏟아지지 않게 seedOnly=true 로 상태만 기록할 수 있음.
 */
export async function notifyIfFeedbackChanged(v: VideoEntry, opts: { seedOnly?: boolean } = {}) {
  const fb = v.feedback.trim();
  if (!fb) return { notified: 0, reason: "no-feedback" as const };

  const h = hash(fb);
  const [prev] = await db.select().from(tables.notionVideoState).where(eq(tables.notionVideoState.pageId, normId(v.pageId)));
  if (prev?.feedbackHash === h) return { notified: 0, reason: "unchanged" as const };

  await db
    .insert(tables.notionVideoState)
    .values({ pageId: normId(v.pageId), feedbackHash: h })
    .onConflictDoUpdate({ target: tables.notionVideoState.pageId, set: { feedbackHash: h, notifiedAt: new Date() } });
  if (opts.seedOnly) return { notified: 0, reason: "seeded" as const };

  // 노션 교육생 페이지 → 앱 회원
  const all = await db
    .select({ id: tables.users.id, np: tables.users.notionStudentPageId })
    .from(tables.users)
    .where(inArray(tables.users.notionStudentPageId, v.studentPageIds.flatMap((id) => [id, normId(id)])));
  const ids = new Set(v.studentPageIds.map(normId));
  const targets = all.filter((u) => u.np && ids.has(normId(u.np))).map((u) => u.id);

  const n = await sendPush(targets, {
    title: prev ? "강습영상 피드백이 수정됐어요" : "강습영상 피드백이 도착했어요",
    body: v.title || "새 피드백을 확인해 보세요",
    url: `/my/videos/${normId(v.pageId)}`,
    tag: `video-${normId(v.pageId)}`,
  });
  return { notified: n, reason: "sent" as const };
}
