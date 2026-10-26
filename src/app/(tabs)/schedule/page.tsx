import PageHeader from "@/components/PageHeader";
import { syncCalendarIfStale } from "@/lib/gcal";
import ScheduleBoard, { type DayData } from "./ScheduleBoard";
import { listBookedBetween, listSchedulesBetween, scheduleTypeLabel } from "@/lib/schedule";
import { won } from "@/lib/pricing";
import { addDays, hm, kst, todayYmd, weekday } from "@/lib/time";

// 누구나 보는 화면이라 30초 동안 캐시 (관리자·신청 변경 시 바로 갱신)
export const revalidate = 30;
export const metadata = { title: "일정 | 딥테일 프리다이빙" };

const DAYS_SHOWN = 21;

export default async function SchedulePage() {
  const today = todayYmd();
  const days = Array.from({ length: DAYS_SHOWN }, (_, i) => addDays(today, i));
  const last = days[days.length - 1];

  // 구글 캘린더를 10분 넘게 안 읽었으면 먼저 읽어옴
  await syncCalendarIfStale().catch(() => undefined);

  // 3주치를 한 번에 받아 두고, 날짜를 누르면 화면에서 바로 바꿈 (서버 왕복 없음)
  const [items, booked] = await Promise.all([
    listSchedulesBetween(kst(today), kst(last, "23:59")),
    listBookedBetween(kst(today), kst(last, "23:59")),
  ]);

  const data: Record<string, DayData> = {};
  for (const d of days) {
    const from = kst(d).getTime();
    const to = kst(d, "23:59").getTime();
    const on = (s: Date, e: Date) => s.getTime() < to && e.getTime() > from;
    const today_ = items.filter((s) => on(s.startsAt, s.endsAt));
    // 정규수업·유료트레이닝 일정(구글 캘린더에서 온 수업 포함)은 이름 없이 '수업 예약됨'으로만
    const isPrivate = (t: string) => t === "REGULAR_CLASS" || t === "PAID_TRAINING";
    data[d] = [
      ...today_
        .filter((s) => s.type === "CLOSURE")
        .map((s) => ({ kind: "closure" as const, id: s.id, t: 0, title: s.title })),
      ...today_
        .filter((s) => isPrivate(s.type))
        .map((s) => ({
          kind: "booked" as const,
          id: s.id,
          t: s.startsAt.getTime(),
          time: `${hm(s.startsAt)} ~ ${hm(s.endsAt)}`,
          location: s.location,
        })),
      ...today_
        .filter((s) => s.type !== "CLOSURE" && !isPrivate(s.type))
        .map((s) => ({
          kind: "schedule" as const,
          id: s.id,
          t: s.startsAt.getTime(),
          type: s.type as Exclude<typeof s.type, "CLOSURE">,
          typeLabel: scheduleTypeLabel[s.type],
          title: s.title,
          time: `${hm(s.startsAt)} ~ ${hm(s.endsAt)}`,
          location: s.location,
          fee: s.fee ? won(s.fee) : null,
          note: s.note,
          capacity: s.capacity,
          joined: s.joined,
        })),
      ...booked
        .filter((b) => b.startsAt && b.endsAt && on(b.startsAt, b.endsAt))
        .map((b) => ({
          kind: "booked" as const,
          id: b.id,
          t: b.startsAt!.getTime(),
          time: `${hm(b.startsAt!)} ~ ${hm(b.endsAt!)}`,
          location: b.location,
        })),
    ].sort((a, b) => a.t - b.t);
  }

  return (
    <>
      <PageHeader title="일정안내 및 예약" />
      <ScheduleBoard
        today={today}
        days={days.map((d) => ({ d, w: weekday(d) }))}
        data={data}
      />
    </>
  );
}
