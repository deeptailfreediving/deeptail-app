// 모든 날짜·시간은 한국 시간(KST, UTC+9) 기준으로 다룸
const TZ = "Asia/Seoul";

/** "2026-11-03" + "10:00" → KST 기준 Date */
export const kst = (date: string, time = "00:00") => new Date(`${date}T${time}:00+09:00`);

/** Date → KST "YYYY-MM-DD" */
export const ymd = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

export const todayYmd = () => ymd(new Date());

export const addDays = (date: string, n: number) => {
  const d = kst(date);
  d.setUTCDate(d.getUTCDate() + n);
  return ymd(d);
};

export const hm = (d: Date) =>
  new Intl.DateTimeFormat("ko-KR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
export const weekday = (date: string) => WEEK[kst(date, "12:00").getUTCDay()];

export const md = (date: string) => {
  const [, m, d] = date.split("-");
  return `${Number(m)}월 ${Number(d)}일`;
};

export const longDate = (d: Date) => {
  const s = ymd(d);
  return `${md(s)} (${weekday(s)})`;
};

export const isYmd = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

// 신청 가능한 시작 시각: 07:00 ~ 21:00, 30분 단위
export const START_TIMES = Array.from({ length: 29 }, (_, i) => {
  const mins = 7 * 60 + i * 30;
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
});

export const SESSION_HOURS = 3; // 안내문 기준 회차당 약 3시간
