import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, tables } from "@/db";
import PageHeader from "@/components/PageHeader";
import VideoStatus from "@/components/VideoStatus";
import { getSession } from "@/lib/auth";
import { embedUrl, getVideoEntry, listVideoFiles, normId, notionEnabled } from "@/lib/notion";
import { md, weekday } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "강습영상 | 딥테일 프리다이빙" };

export default async function VideoDetail({ params }: { params: { pageId: string } }) {
  const session = (await getSession())!;
  const [me] = await db.select().from(tables.users).where(eq(tables.users.id, session.user.id));
  if (!notionEnabled() || !/^[0-9a-f]{32}$/i.test(params.pageId)) notFound();

  const entry = await getVideoEntry(params.pageId);
  const staff = session.user.role !== "STUDENT";
  const mine = !!me.notionStudentPageId && !!entry?.studentPageIds.some((id) => normId(id) === normId(me.notionStudentPageId!));
  // 강습영상 DB의 페이지이고, 본인 영상(또는 강사·대표)일 때만
  if (!entry || !entry.inVideoDb || !(mine || staff)) notFound();

  const files = await listVideoFiles(entry.pageId);
  const sameDayLog = entry.date
    ? (
        await db
          .select({ id: tables.diveLogs.id })
          .from(tables.diveLogs)
          .where(and(eq(tables.diveLogs.userId, session.user.id), eq(tables.diveLogs.diveDate, entry.date)))
          .limit(1)
      )[0]
    : undefined;

  return (
    <>
      <PageHeader title="강습영상" back="/my/videos" />
      <div className="flex flex-col gap-4 p-4 pb-10">
        <section className="flex flex-col gap-1.5 rounded-2xl bg-white p-4 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold">{entry.date ? `${md(entry.date)} (${weekday(entry.date)})` : "날짜 미정"}</h2>
            <VideoStatus status={entry.status} hasFeedback={!!entry.feedback} />
          </div>
          <p className="text-xs text-ink-sub">
            {entry.title} · 영상 {files.length}개
          </p>
          {sameDayLog && (
            <Link href={`/my/logbook/${sameDayLog.id}`} className="mt-1 text-sm font-bold text-brand">
              이 날의 다이빙 로그 보기 →
            </Link>
          )}
        </section>

        <section className="flex flex-col gap-2 rounded-2xl border border-brand/30 bg-brand-tint p-4">
          <h3 className="text-sm font-bold text-brand-mid">강사 피드백</h3>
          {entry.feedback ? (
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink">{entry.feedback}</p>
          ) : (
            <p className="text-sm text-ink-sub">피드백을 준비하고 있어요. 작성되면 알림으로 알려드려요.</p>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="mx-1 text-base font-bold">영상</h3>
          {files.length === 0 && (
            <p className="rounded-2xl bg-white p-5 text-center text-sm text-ink-mute shadow-card">아직 올라온 영상이 없어요.</p>
          )}
          {files.map((f, i) => {
            const embed = f.external ? embedUrl(f.url) : null;
            return (
              <figure key={`${f.name}-${i}`} className="overflow-hidden rounded-2xl bg-black shadow-card">
                {embed ? (
                  <iframe
                    src={embed}
                    title={f.caption || `영상 ${i + 1}`}
                    className="aspect-video w-full"
                    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : f.external ? (
                  <a href={f.url} target="_blank" rel="noreferrer" className="block bg-white p-4 text-sm font-bold text-brand">
                    영상 열기 ({f.name})
                  </a>
                ) : (
                  <video controls playsInline preload="metadata" src={f.url} className="aspect-video w-full bg-black" />
                )}
                <figcaption className="bg-white px-3 py-2 text-xs text-ink-sub">
                  {i + 1}. {f.caption || f.name}
                </figcaption>
              </figure>
            );
          })}
          {files.some((f) => /\.mov$/i.test(f.name)) && (
            <p className="mx-1 text-xs text-ink-mute">휴대폰으로 찍은 .mov 영상은 일부 기기에서 재생되지 않을 수 있어요.</p>
          )}
        </section>
      </div>
    </>
  );
}
