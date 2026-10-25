import { asc, eq, gte, sql } from "drizzle-orm";
import { db, tables } from "@/db";
import { getSession } from "@/lib/auth";
import { won } from "@/lib/pricing";
import { scheduleTypeLabel } from "@/lib/schedule";
import { hm, longDate, todayYmd } from "@/lib/time";
import { deleteSchedule } from "../actions";
import { ActionButton, Empty, Flash, Section } from "../ui";
import ScheduleForm from "./ScheduleForm";

export default async function AdminSchedules({ searchParams }: { searchParams: { msg?: string } }) {
  const session = (await getSession())!;
  const { schedules: s, locations: l, registrations: r } = tables;
  const [locations, list] = await Promise.all([
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
        joined: sql<number>`(select count(*)::int from ${r} where ${r.scheduleId} = ${s.id} and ${r.status} in ('PENDING','APPROVED'))`,
      })
      .from(s)
      .leftJoin(l, eq(s.locationId, l.id))
      .where(gte(s.endsAt, new Date()))
      .orderBy(asc(s.startsAt))
      .limit(60),
  ]);

  return (
    <>
      <Flash msg={searchParams.msg} />
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
                  <span className="truncate text-sm font-bold">{x.title}</span>
                  <span className="text-xs text-ink-sub">
                    {longDate(x.startsAt)} {hm(x.startsAt)}~{hm(x.endsAt)} · {x.location ?? "장소 미정"}
                  </span>
                  <span className="text-xs text-ink-mute">
                    신청 {x.joined}
                    {x.capacity != null ? ` / ${x.capacity}명` : "명"}
                    {x.fee ? ` · ${won(x.fee)}` : " · 무료"}
                  </span>
                </div>
                {session.user.role === "ADMIN" && (
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
