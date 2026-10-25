// 노션 웹훅: 강습영상 페이지가 바뀌면 피드백을 확인하고 교육생에게 푸시
import { createHmac, timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, tables } from "@/db";
import { notifyIfFeedbackChanged } from "@/lib/feedbackNotify";
import { getVideoEntry, notionEnabled } from "@/lib/notion";

export const dynamic = "force-dynamic";

const TOKEN_KEY = "notion_webhook_token";

export async function POST(req: Request) {
  const raw = await req.text();
  let body: { verification_token?: string; type?: string; entity?: { id?: string; type?: string } };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // 1) 웹훅 등록 직후 노션이 보내는 확인 토큰 → 저장 (관리자 화면에서 확인해 노션에 붙여넣기)
  if (body.verification_token) {
    await db
      .insert(tables.appSettings)
      .values({ key: TOKEN_KEY, value: body.verification_token })
      .onConflictDoUpdate({ target: tables.appSettings.key, set: { value: body.verification_token } });
    return NextResponse.json({ ok: true });
  }

  // 2) 서명 확인 (토큰이 저장돼 있을 때)
  const [saved] = await db.select().from(tables.appSettings).where(eq(tables.appSettings.key, TOKEN_KEY));
  if (saved) {
    const sig = req.headers.get("x-notion-signature") ?? "";
    const expected = `sha256=${createHmac("sha256", saved.value).update(raw).digest("hex")}`;
    const ok = sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    if (!ok) return NextResponse.json({ ok: false }, { status: 401 });
  }

  // 3) 페이지 변경 이벤트 → 강습영상 DB 페이지면 피드백 확인
  if (notionEnabled() && body.type?.startsWith("page.") && body.entity?.type === "page" && body.entity.id) {
    const entry = await getVideoEntry(body.entity.id);
    if (entry?.inVideoDb) {
      const r = await notifyIfFeedbackChanged(entry);
      return NextResponse.json({ ok: true, ...r });
    }
  }
  return NextResponse.json({ ok: true, skipped: true });
}
