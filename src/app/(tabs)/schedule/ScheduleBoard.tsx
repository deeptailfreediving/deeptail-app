"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n: number) => String(n).padStart(2, "0");
const weekdayOf = (d: string) => WEEK[new Date(`${d}T12:00:00Z`).getUTCDay()];

// 달력 칸에 찍는 점 색 (종류별)
const dotColor: Record<string, string> = {
  REGULAR_TRAINING: "bg-brand",
  SELF_PRACTICE: "bg-teal-400",
  PAID_TRAINING: "bg-amber-400",
  REGULAR_CLASS: "bg-amber-400",
  OVERSEAS_TOUR: "bg-brand-deep",
  booked: "bg-ink-mute/40",
};

const legend = [
  { c: "bg-brand", t: "정기트레이닝" },
  { c: "bg-teal-400", t: "자율연습반" },
  { c: "bg-amber-400", t: "유료트레이닝" },
  { c: "bg-ink-mute/40", t: "예약됨" },
];

export default function ScheduleBoard({
  today,
  last,
  data,
}: {
  today: string;
  last: string;
  data: Record<string, DayData>;
}) {
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(today.slice(0, 7)); // YYYY-MM

  // 주소의 ?date= 로 들어온 경우 그 날짜를 선택
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("date");
    if (q && data[q]) {
      setDate(q);
      setMonth(q.slice(0, 7));
    }
  }, [data]);

  function pick(d: string) {
    setDate(d);
    // 화면 이동 없이 주소만 바꿔서 뒤로가기·새로고침 때도 같은 날짜
    window.history.replaceState(window.history.state, "", `/schedule?date=${d}`);
  }

  const [y, m] = month.split("-").map(Number);
  const firstWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${pad(i + 1)}`),
  ];
  const shift = (n: number) => {
    const d = new Date(Date.UTC(y, m - 1 + n, 1));
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
  };
  const canPrev = month > today.slice(0, 7);
  const canNext = month < last.slice(0, 7);

  const timeline = data[date] ?? [];
  const w = weekdayOf(date);

  return (
    <>
      {/* 달력 */}
      <section aria-label="일정 달력" className="border-b border-line bg-white px-3 pb-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => setMonth(shift(-1))}
            aria-label="이전 달"
            className="flex h-11 w-11 items-center justify-center rounded-full text-xl disabled:opacity-20"
          >
            ‹
          </button>
          <h2 className="text-base font-bold">
            {y}년 {m}월
          </h2>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setMonth(shift(1))}
            aria-label="다음 달"
            className="flex h-11 w-11 items-center justify-center rounded-full text-xl disabled:opacity-20"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-[11px] font-medium text-ink-mute">
          {WEEK.map((d, i) => (
            <span key={d} className={`py-1 ${i === 0 ? "text-red-600" : i === 6 ? "text-brand" : ""}`}>
              {d}
            </span>
          ))}
        </div>

        <div key={month} className="grid animate-fade-in grid-cols-7 gap-y-1">
          {cells.map((d, i) => {
            if (!d) return <span key={`e${i}`} />;
            const inRange = d >= today && d <= last;
            const items = data[d] ?? [];
            const closed = items.some((x) => x.kind === "closure");
            const kinds = [
              ...new Set(items.filter((x) => x.kind !== "closure").map((x) => (x.kind === "schedule" ? x.type : "booked"))),
            ].slice(0, 4);
            const active = d === date;
            const wd = i % 7;
            return (
              <button
                key={d}
                type="button"
                disabled={!inRange}
                onClick={() => pick(d)}
                aria-current={active ? "date" : undefined}
                aria-label={`${Number(d.slice(5, 7))}월 ${Number(d.slice(8))}일${items.length ? `, 일정 ${items.filter((x) => x.kind !== "closure").length}개` : ""}${closed ? ", 휴관 있음" : ""}`}
                className={`mx-auto flex h-12 w-full max-w-[52px] flex-col items-center justify-start gap-1 rounded-xl pt-1.5 text-sm disabled:opacity-30 ${
                  active ? "bg-brand text-white" : d === today ? "bg-brand-tint" : ""
                }`}
              >
                <span
                  className={`leading-none ${active ? "font-bold" : wd === 0 ? "text-red-600" : wd === 6 ? "text-brand" : ""} ${
                    d === today && !active ? "font-bold" : ""
                  }`}
                >
                  {Number(d.slice(8))}
                </span>
                <span className="flex h-1.5 items-center gap-0.5">
                  {kinds.map((k) => (
                    <span key={k} className={`h-1.5 w-1.5 rounded-full ${active ? "bg-white" : dotColor[k]}`} />
                  ))}
                  {closed && <span className={`text-[9px] font-bold leading-none ${active ? "text-white" : "text-red-500"}`}>휴</span>}
                </span>
              </button>
            );
          })}
        </div>

        <ul className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-ink-sub">
          {legend.map((l) => (
            <li key={l.t} className="flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${l.c}`} />
              {l.t}
            </li>
          ))}
          <li className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-red-500">휴</span>휴관
          </li>
        </ul>
      </section>

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
                    {t.capacity != null
                      ? t.capacity - t.joined > 0
                        ? `남은 자리 ${t.capacity - t.joined}명`
                        : "마감"
                      : `${t.joined}명 참여`}
                  </span>
                </div>
                <p className="text-[15px] font-bold">{t.title}</p>
                <p className="text-sm text-ink-sub">
                  {t.time} · {t.location ?? "장소 미정"}
                  {t.fee ? ` · ${t.fee}` : " · 무료"}
                </p>
                {t.note && <p className="text-xs text-ink-mute">{t.note}</p>}
                {(t.type === "SELF_PRACTICE" || t.type === "REGULAR_TRAINING" || t.type === "OVERSEAS_TOUR" || t.type === "PAID_TRAINING") &&
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
