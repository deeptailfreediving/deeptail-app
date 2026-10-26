// 매일 한 번: 네이버 카페 후기 가져오기 + 최근 2일 사이 수정된 강습영상의 피드백을 점검 (웹훅을 놓쳤을 때 대비)
// ?seed=1 : 처음 연동할 때 기존 피드백은 알림 없이 '이미 알림' 상태로만 기록
import { NextResponse } from "next/server";
import { notifyIfFeedbackChanged } from "@/lib/feedbackNotify";
import { listRecentlyEditedVideos, notionEnabled } from "@/lib/notion";
import { reviewsEnabled, syncReviews } from "@/lib/reviews";
import { gcalEnabled, syncCalendar } from "@/lib/gcal";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  // 같은 작업에서 네이버 카페 후기도 하루 한 번 가져옴 (Vercel 무료 요금제는 예약 작업이 하루 1회)
  const reviews = reviewsEnabled() ? await syncReviews() : null;
  const calendar = gcalEnabled() ? await syncCalendar() : null;
  if (!notionEnabled()) return NextResponse.json({ ok: false, reason: "NOTION_TOKEN 없음", reviews, calendar });

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
  return NextResponse.json({ ok: true, checked: videos.length, notified, seed, reviews, calendar });
}
