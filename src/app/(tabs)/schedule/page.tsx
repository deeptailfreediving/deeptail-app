import PageHeader from "@/components/PageHeader";
import { syncCalendarIfStale } from "@/lib/gcal";
import ScheduleBoard, { type DayData } from "./ScheduleBoard";
import { listBookedBetween, listSchedulesBetween, scheduleTypeLabel } from "@/lib/schedule";
import { won } from "@/lib/pricing";
import { addDays, hm, kst, todayYmd } from "@/lib/time";

// 누구나 보는 화면이라 30초 동안 캐시 (관리자·신청 변경 시 바로 갱신)
export const revalidate = 30;
export const metadata = { title: "일정 | 딥테일 프리다이빙" };

// 달력: 이번 달 포함 3개월 (오늘부터 신청 가능)
const MONTHS_SHOWN = 3;

function lastDayShown(today: string) {
  const [y, m] = today.split("-").map(Number);
  const end = new Date(Date.UTC(y, m - 1 + MONTHS_SHOWN, 0)); // 2달 뒤 달의 마지막 날
  return end.toISOString().slice(0, 10);
}

export default async function SchedulePage() {
  const today = todayYmd();
  const last = lastDayShown(today);
  const days: string[] = [];
  for (let d = today; d <= last; d = addDays(d, 1)) days.push(d);

  // 구글 캘린더를 10분 넘게 안 읽었으면 먼저 읽어옴
  await syncCalendarIfStale().catch(() => undefined);

  // 3개월치를 한 번에 받아 두고, 날짜를 누르면 화면에서 바로 바꿈 (서버 왕복 없음)
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
    // 정규수업(규칙에 안 맞은 강사 일정 포함)은 이름 없이 '수업 예약됨'으로만
    const isPrivate = (t: string) => t === "REGULAR_CLASS";
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
        last={last}
        data={data}
      />
    </>
  );
}
