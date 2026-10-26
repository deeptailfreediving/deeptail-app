"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type ScheduleType = "SELF_PRACTICE" | "REGULAR_TRAINING" | "REGULAR_CLASS" | "PAID_TRAINING" | "OVERSEAS_TOUR";

export type DayData = (
  | {
      kind: "schedule";
      id: string;
      t: number;
      type: ScheduleType;
      typeLabel: string;
      title: string;
      time: string;
      location: string | null;
      fee: string | null;
      note: string | null;
      capacity: number | null;
      joined: number;
    }
  | { kind: "booked"; id: string; t: number; time: string; location: string | null }
  | { kind: "closure"; id: string; t: number; title: string }
)[];

const typeStyle: Record<ScheduleType, string> = {
  SELF_PRACTICE: "bg-brand-tint text-brand-mid",
  REGULAR_TRAINING: "bg-brand text-white",
  REGULAR_CLASS: "bg-amber-100 text-amber-900",
  PAID_TRAINING: "bg-amber-100 text-amber-900",
  OVERSEAS_TOUR: "bg-brand-deep text-white",
};

const md = (d: string) => `${Number(d.slice(5, 7))}월 ${Number(d.slice(8))}일`;

export default function ScheduleBoard({
  today,
  days,
  data,
}: {
  today: string;
  days: { d: string; w: string }[];
  data: Record<string, DayData>;
}) {
  const [date, setDate] = useState(today);
  const stripRef = useRef<HTMLOListElement>(null);

  // 주소의 ?date= 로 들어온 경우 그 날짜를 선택
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("date");
    if (q && data[q]) setDate(q);
  }, [data]);

  // 선택한 날짜를 가로 목록 가운데로
  useEffect(() => {
    stripRef.current
      ?.querySelector('[aria-current="date"]')
      ?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [date]);

  function pick(d: string) {
    setDate(d);
    // 화면 이동 없이 주소만 바꿔서 뒤로가기·새로고침 때도 같은 날짜
    window.history.replaceState(window.history.state, "", `/schedule?date=${d}`);
  }

  const timeline = data[date] ?? [];
  const w = days.find((x) => x.d === date)?.w ?? "";

  return (
    <>
      {/* 날짜 선택 */}
      <nav aria-label="날짜 선택" className="sticky top-14 z-[5] border-b border-line bg-white">
        <ol ref={stripRef} className="flex gap-1.5 overflow-x-auto px-3 py-3 [scrollbar-width:none]">
          {days.map(({ d, w }) => {
            const active = d === date;
            const has = (data[d] ?? []).some((x) => x.kind !== "closure");
            return (
              <li key={d}>
                <button
                  type="button"
                  onClick={() => pick(d)}
                  aria-current={active ? "date" : undefined}
                  className={`relative flex h-16 w-12 flex-col items-center justify-center gap-0.5 rounded-xl text-xs ${
                    active ? "bg-brand text-white" : "bg-canvas text-ink"
                  }`}
                >
                  <span className={active ? "" : w === "일" ? "text-red-600" : w === "토" ? "text-brand" : "text-ink-mute"}>
                    {d === today ? "오늘" : w}
                  </span>
                  <span className="text-base font-bold">{Number(d.slice(8))}</span>
                  {has && (
                    <span
                      aria-hidden
                      className={`absolute bottom-1.5 h-1 w-1 rounded-full ${active ? "bg-white" : "bg-brand"}`}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="flex flex-col gap-3 p-4 pb-32">
        <h2 className="mx-1 text-base font-bold">
          {md(date)} ({w})
        </h2>

        {timeline.every((t) => t.kind === "closure") && (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-ink-sub shadow-card">
            이 날은 등록된 일정이 없어요.
            <br />
            원하는 시간에 수업을 신청할 수 있어요.
          </p>
        )}

        <ul key={date} className="flex animate-fade-in flex-col gap-2.5">
          {timeline.map((t) =>
            t.kind === "closure" ? (
              <li
                key={t.id}
                className="flex items-center gap-2 rounded-2xl bg-ink/5 px-4 py-3 text-sm font-medium text-ink-sub"
              >
                <span aria-hidden>⛔</span>
                {t.title} (종일)
              </li>
            ) : t.kind === "schedule" ? (
              <li key={t.id} className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-card">
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${typeStyle[t.type]}`}>
                    {t.typeLabel}
                  </span>
                  <span className="text-xs text-ink-mute">
                    {t.capacity != null ? `${t.joined} / ${t.capacity}명` : `${t.joined}명 참여`}
                  </span>
                </div>
                <p className="text-[15px] font-bold">{t.title}</p>
                <p className="text-sm text-ink-sub">
                  {t.time} · {t.location ?? "장소 미정"}
                  {t.fee ? ` · ${t.fee}` : " · 무료"}
                </p>
                {t.note && <p className="text-xs text-ink-mute">{t.note}</p>}
                {(t.type === "SELF_PRACTICE" || t.type === "REGULAR_TRAINING" || t.type === "OVERSEAS_TOUR") &&
                  (t.capacity == null || t.joined < t.capacity ? (
                    <Link
                      href={`/schedule/apply?join=${t.id}`}
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
                key={t.id}
                className="flex items-center justify-between rounded-2xl border border-dashed border-line bg-white/60 px-4 py-3 text-sm text-ink-mute"
              >
                <span>{t.time} · 수업 예약됨</span>
                <span className="text-xs">{t.location}</span>
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
