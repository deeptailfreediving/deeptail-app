// 매일 한 번: 최근 2일 사이 수정된 강습영상의 피드백을 점검 (웹훅을 놓쳤을 때 대비)
// ?seed=1 : 처음 연동할 때 기존 피드백은 알림 없이 '이미 알림' 상태로만 기록
import { NextResponse } from "next/server";
import { notifyIfFeedbackChanged } from "@/lib/feedbackNotify";
import { listRecentlyEditedVideos, notionEnabled } from "@/lib/notion";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!notionEnabled()) return NextResponse.json({ ok: false, reason: "NOTION_TOKEN 없음" });

  const url = new URL(req.url);
  const seed = url.searchParams.get("seed") === "1";
  const days = seed ? 3650 : 2;
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const videos = await listRecentlyEditedVideos(since);
  let notified = 0;
  for (const v of videos) {
    const r = await notifyIfFeedbackChanged(v, { seedOnly: seed });
    notified += r.notified;
  }
  return NextResponse.json({ ok: true, checked: videos.length, notified, seed });
}
