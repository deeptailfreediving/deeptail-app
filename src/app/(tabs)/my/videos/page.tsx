import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, tables } from "@/db";
import PageHeader, { ComingSoon } from "@/components/PageHeader";
import VideoStatus from "@/components/VideoStatus";
import { getSession } from "@/lib/auth";
import { listVideosForStudent, normId, notionEnabled } from "@/lib/notion";
import { md, weekday } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "강습영상 | 딥테일 프리다이빙" };

export default async function VideosPage() {
  const session = (await getSession())!;
  const [me] = await db.select().from(tables.users).where(eq(tables.users.id, session.user.id));

  if (!notionEnabled() || !me.notionStudentPageId) {
    return (
      <>
        <PageHeader title="강습영상" back="/my/logbook" />
        <ComingSoon>
          아직 강습영상이 연결되지 않았어요.
          <br />
          강사가 연결하면 영상과 피드백이 여기에 보여요.
        </ComingSoon>
      </>
    );
  }

  let videos: Awaited<ReturnType<typeof listVideosForStudent>> = [];
  let failed = false;
  try {
    videos = await listVideosForStudent(me.notionStudentPageId);
  } catch (e) {
    console.error(e);
    failed = true;
  }

  return (
    <>
      <PageHeader title="강습영상" back="/my/logbook" />
      <div className="flex flex-col gap-2 p-4">
        {failed && (
          <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            영상을 불러오지 못했어요. 잠시 후 다시 열어 주세요.
          </p>
        )}
        {!failed && videos.length === 0 && (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-ink-sub shadow-card">아직 올라온 강습영상이 없어요.</p>
        )}
        <ul className="flex flex-col gap-2">
          {videos.map((v) => (
            <li key={v.pageId}>
              <Link href={`/my/videos/${normId(v.pageId)}`} className="flex flex-col gap-1.5 rounded-2xl bg-white p-4 shadow-card">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-bold">{v.date ? `${md(v.date)} (${weekday(v.date)})` : "날짜 미정"}</span>
                  <VideoStatus status={v.status} hasFeedback={!!v.feedback} />
                </span>
                <span className="truncate text-xs text-ink-sub">{v.title}</span>
                {v.feedback && <span className="line-clamp-2 text-sm text-ink">{v.feedback}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
