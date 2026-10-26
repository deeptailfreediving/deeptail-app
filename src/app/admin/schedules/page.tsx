import { asc, eq, gte, sql } from "drizzle-orm";
import { db, tables } from "@/db";
import { getSession } from "@/lib/auth";
import { won } from "@/lib/pricing";
import { scheduleTypeLabel } from "@/lib/schedule";
import { hm, longDate, todayYmd } from "@/lib/time";
import { deleteSchedule, syncCalendarNow } from "../actions";
import { gcalEnabled, lastCalendarSync } from "@/lib/gcal";
import { ActionButton, Empty, Flash, Section } from "../ui";
import ScheduleForm from "./ScheduleForm";

export default async function AdminSchedules({ searchParams }: { searchParams: { msg?: string } }) {
  const session = (await getSession())!;
  const { schedules: s, locations: l, registrations: r } = tables;
  const [locations, list, sync] = await Promise.all([
    db.select().from(l).where(eq(l.isActive, true)).orderBy(asc(l.sortOrder)),
    db
      .select({
        id: s.id,
        type: s.type,
        title: s.title,
        startsAt: s.startsAt,
        endsAt: s.endsAt,
        capacity: s.capacity,
        fee: s.fee,
        location: l.name,
        externalTitle: s.externalTitle,
        joined: sql<number>`(select count(*)::int from ${r} where ${r.scheduleId} = ${s.id} and ${r.status} in ('PENDING','APPROVED'))`,
      })
      .from(s)
      .leftJoin(l, eq(s.locationId, l.id))
      .where(gte(s.endsAt, new Date()))
      .orderBy(asc(s.startsAt))
      .limit(150),
    lastCalendarSync(),
  ]);
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

  return (
    <>
      <Flash msg={searchParams.msg} />
      <Section title="구글 캘린더 연동">
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-4 text-sm shadow-card">
          <p className="text-xs text-ink-sub">
            &lsquo;DEEPTAIL 교육일정&rsquo; 캘린더를 10분마다 읽어 앞으로 90일 일정을 앱에 넣어요. 캘린더에서 고치면 앱에도 반영돼요.
            교육생에게는 수업 일정이 이름 없이 &lsquo;수업 예약됨&rsquo;으로만 보여요.
          </p>
          <p className="text-xs">
            {!gcalEnabled() ? (
              <b className="text-amber-800">Vercel 환경변수 GOOGLE_CALENDAR_ICS_URL 을 넣어 주세요.</b>
            ) : sync ? (
              <span className={sync.ok ? "text-ink-sub" : "font-bold text-red-700"}>
                마지막 읽기 {fmt(sync.at)} · {sync.ok ? `일정 ${sync.imported}건 반영${sync.removed ? `, ${sync.removed}건 삭제` : ""}` : `실패: ${sync.error}`}
              </span>
            ) : (
              <span className="text-ink-sub">아직 읽은 적이 없어요.</span>
            )}
          </p>
          {sync?.ok && sync.unknown.length > 0 && (
            <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
              <b>규칙에 없는 일정 이름 {sync.unknown.length}개</b> — &lsquo;수업 예약됨&rsquo;(강사 일정 있음)으로 처리했어요.
              <span className="mt-1 block text-amber-800">{sync.unknown.slice(0, 12).join(" · ")}</span>
            </div>
          )}
          {gcalEnabled() && (
            <div>
              <ActionButton action={syncCalendarNow}>지금 읽어오기</ActionButton>
            </div>
          )}
        </div>
      </Section>
      <Section title="일정 등록">
        <ScheduleForm locations={locations.map((x) => ({ id: x.id, name: x.name }))} minDate={todayYmd()} />
      </Section>

      <Section title="다가오는 일정" count={list.length}>
        {list.length === 0 ? (
          <Empty>등록된 일정이 없어요.</Empty>
        ) : (
          <ul className="flex flex-col gap-2">
            {list.map((x) => (
              <li key={x.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-card">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[11px] font-bold text-brand">{scheduleTypeLabel[x.type]}</span>
                  <span className="truncate text-sm font-bold">
                    {x.externalTitle ?? x.title}
                    {x.externalTitle && <span className="ml-1.5 rounded bg-brand-tint px-1.5 py-0.5 text-[10px] text-brand-mid">캘린더</span>}
                  </span>
                  <span className="text-xs text-ink-sub">
                    {longDate(x.startsAt)} {x.type === "CLOSURE" ? "종일" : `${hm(x.startsAt)}~${hm(x.endsAt)}`} · {x.location ?? "장소 미정"}
                  </span>
                  <span className="text-xs text-ink-mute">
                    신청 {x.joined}
                    {x.capacity != null ? ` / ${x.capacity}명` : "명"}
                    {x.fee ? ` · ${won(x.fee)}` : " · 무료"}
                  </span>
                </div>
                {session.user.role === "ADMIN" && !x.externalTitle && (
                  <ActionButton action={deleteSchedule.bind(null, x.id)} tone="danger">
                    삭제
                  </ActionButton>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
