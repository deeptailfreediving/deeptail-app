import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import ScrollToCurrent from "@/components/ScrollToCurrent";
import { listBookedOn, listSchedulesOn, scheduleTypeLabel } from "@/lib/schedule";
import { won } from "@/lib/pricing";
import { addDays, hm, isYmd, md, todayYmd, weekday } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "일정 | 딥테일 프리다이빙" };

const DAYS_SHOWN = 21;

const typeStyle: Record<keyof typeof scheduleTypeLabel, string> = {
  SELF_PRACTICE: "bg-brand-tint text-brand-mid",
  REGULAR_TRAINING: "bg-brand text-white",
  REGULAR_CLASS: "bg-amber-100 text-amber-900",
  PAID_TRAINING: "bg-amber-100 text-amber-900",
  OVERSEAS_TOUR: "bg-brand-deep text-white",
};

export default async function SchedulePage({ searchParams }: { searchParams: { date?: string } }) {
  const today = todayYmd();
  const date = isYmd(searchParams.date) && searchParams.date >= today ? searchParams.date : today;
  const days = Array.from({ length: DAYS_SHOWN }, (_, i) => addDays(today, i));

  const [items, booked] = await Promise.all([listSchedulesOn(date), listBookedOn(date)]);

  const timeline = [
    ...items.map((s) => ({ kind: "schedule" as const, start: s.startsAt, s })),
    ...booked.map((b) => ({ kind: "booked" as const, start: b.startsAt!, b })),
  ].sort((a, b) => a.start.getTime() - b.start.getTime());

  return (
    <>
      <PageHeader title="일정안내 및 예약" />

      {/* 날짜 선택 */}
      <nav aria-label="날짜 선택" className="sticky top-14 z-[5] border-b border-line bg-white">
        <ol className="flex gap-1.5 overflow-x-auto px-3 py-3 [scrollbar-width:none]">
          {days.map((d) => {
            const active = d === date;
            const w = weekday(d);
            return (
              <li key={d}>
                <Link
                  href={`/schedule?date=${d}`}
                  aria-current={active ? "date" : undefined}
                  scroll={false}
                  className={`flex h-16 w-12 flex-col items-center justify-center gap-0.5 rounded-xl text-xs ${
                    active ? "bg-brand text-white" : "bg-canvas text-ink"
                  }`}
                >
                  <span className={active ? "" : w === "일" ? "text-red-600" : w === "토" ? "text-brand" : "text-ink-mute"}>
                    {d === today ? "오늘" : w}
                  </span>
                  <span className="text-base font-bold">{Number(d.slice(8))}</span>
                </Link>
              </li>
            );
          })}
        </ol>
        <ScrollToCurrent selector='[aria-current="date"]' />
      </nav>

      <div className="flex flex-col gap-3 p-4 pb-32">
        <h2 className="mx-1 text-base font-bold">
          {md(date)} ({weekday(date)})
        </h2>

        {timeline.length === 0 && (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-ink-sub shadow-card">
            이 날은 등록된 일정이 없어요.
            <br />
            원하는 시간에 수업을 신청할 수 있어요.
          </p>
        )}

        <ul className="flex flex-col gap-2.5">
          {timeline.map((t) =>
            t.kind === "schedule" ? (
              <li key={t.s.id} className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-card">
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${typeStyle[t.s.type]}`}>
                    {scheduleTypeLabel[t.s.type]}
                  </span>
                  <span className="text-xs text-ink-mute">
                    {t.s.capacity != null ? `${t.s.joined} / ${t.s.capacity}명` : `${t.s.joined}명 참여`}
                  </span>
                </div>
                <p className="text-[15px] font-bold">{t.s.title}</p>
                <p className="text-sm text-ink-sub">
                  {hm(t.s.startsAt)} ~ {hm(t.s.endsAt)} · {t.s.location ?? "장소 미정"}
                  {t.s.fee ? ` · ${won(t.s.fee)}` : " · 무료"}
                </p>
                {t.s.note && <p className="text-xs text-ink-mute">{t.s.note}</p>}
                {(t.s.type === "SELF_PRACTICE" || t.s.type === "REGULAR_TRAINING" || t.s.type === "OVERSEAS_TOUR") &&
                  (t.s.capacity == null || t.s.joined < t.s.capacity ? (
                    <Link
                      href={`/schedule/apply?join=${t.s.id}`}
                      className="mt-1 flex min-h-11 items-center justify-center rounded-xl border border-brand text-sm font-bold text-brand"
                    >
                      참여 신청
                    </Link>
                  ) : (
                    <span className="mt-1 flex min-h-11 items-center justify-center rounded-xl bg-canvas text-sm text-ink-mute">
                      마감
                    </span>
                  ))}
              </li>
            ) : (
              <li
                key={t.b.id}
                className="flex items-center justify-between rounded-2xl border border-dashed border-line bg-white/60 px-4 py-3 text-sm text-ink-mute"
              >
                <span>
                  {hm(t.b.startsAt!)} ~ {hm(t.b.endsAt!)} · 수업 예약됨
                </span>
                <span className="text-xs">{t.b.location}</span>
              </li>
            ),
          )}
        </ul>
      </div>

      {/* 빈 시간 신청 */}
      <div className="fixed inset-x-0 bottom-[calc(58px+max(env(safe-area-inset-bottom),12px))] z-10 mx-auto max-w-[480px] px-4 pb-3">
        <Link
          href={`/schedule/apply?date=${date}`}
          className="flex min-h-12 flex-col items-center justify-center rounded-xl bg-brand py-2 text-white shadow-card"
        >
          <span className="text-base font-bold">빈 시간에 수업 신청</span>
          <span className="text-[11px] text-brand-soft">정규수업 · 유료트레이닝</span>
        </Link>
      </div>
    </>
  );
}
