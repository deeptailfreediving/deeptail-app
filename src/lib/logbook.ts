import { and, desc, eq } from "drizzle-orm";
import { db, tables } from "@/db";

const { diveLogs: d, users: u } = tables;

export const purposeLabel = {
  SELF_PRACTICE: "자율연습",
  REGULAR_TRAINING: "정기트레이닝",
  REGULAR_CLASS: "정규수업",
  PAID_TRAINING: "유료트레이닝",
  PERSONAL_TRAINING: "개인트레이닝",
  FUN_DIVING: "펀다이빙",
} as const;
export type Purpose = keyof typeof purposeLabel;

// 노션 로그북의 장소 선택지 (연습 장소 7곳 + 대전 · 해양)
export const PLACES = [
  "수원월드컵경기장",
  "성남 아쿠아라인",
  "오산 TSN",
  "파라다이브",
  "딥스테이션",
  "잠실 KUA 다이빙풀",
  "올림픽파크",
  "알프스다이빙(대전)",
  "용운국제수영장(대전)",
  "해양",
];

export const DISCIPLINES = [
  { key: "sta", code: "STA", name: "스테틱", unit: "time" },
  { key: "dyn", code: "DYN", name: "다이나믹", unit: "m" },
  { key: "fim", code: "FIM", name: "프리이멀전", unit: "m" },
  { key: "cwt", code: "CWT", name: "컨스턴트웨이트", unit: "m" },
] as const;
export type DisciplineKey = (typeof DISCIPLINES)[number]["key"];

export type DiveLog = typeof d.$inferSelect;

/** 120 → "2분 0초" */
export function fmtSec(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

export function recordOf(log: DiveLog, key: DisciplineKey): number | null {
  const v = key === "sta" ? log.staSec : key === "dyn" ? log.dynM : key === "fim" ? log.fimM : log.cwtM;
  return v && v > 0 ? v : null;
}

export function noteOf(log: DiveLog, key: DisciplineKey) {
  return key === "sta" ? log.staNote : key === "dyn" ? log.dynNote : key === "fim" ? log.fimNote : log.cwtNote;
}

export function fmtRecord(key: DisciplineKey, v: number) {
  return key === "sta" ? fmtSec(v) : `${Number.isInteger(v) ? v : v.toFixed(1)}m`;
}

export function listMyLogs(userId: string) {
  return db.select().from(d).where(eq(d.userId, userId)).orderBy(desc(d.diveDate), desc(d.createdAt));
}

export async function getMyLog(id: string, userId: string) {
  const [log] = await db.select().from(d).where(and(eq(d.id, id), eq(d.userId, userId)));
  return log ?? null;
}

/** 관리자: 확인 전 로그 / 최근 확인한 로그 */
export async function listLogsForStaff(reviewed: boolean) {
  const rows = await db
    .select({ log: d, studentName: u.name })
    .from(d)
    .innerJoin(u, eq(d.userId, u.id))
    .where(eq(d.reviewed, reviewed))
    .orderBy(reviewed ? desc(d.reviewedAt) : desc(d.diveDate))
    .limit(reviewed ? 20 : 100);
  return rows.map((r) => ({ ...r.log, studentName: r.studentName }));
}

/** 요약: 총 다이빙 수, 종목별 최고 기록, 최근 6개월 월별 횟수, 종목별 기록 추이 */
export function summarize(logs: DiveLog[], today: string) {
  const best = Object.fromEntries(
    DISCIPLINES.map(({ key }) => {
      let top: { v: number; date: string } | null = null;
      for (const l of logs) {
        const v = recordOf(l, key);
        if (v != null && (!top || v > top.v)) top = { v, date: l.diveDate };
      }
      return [key, top];
    }),
  ) as Record<DisciplineKey, { v: number; date: string } | null>;

  const [y, m] = today.split("-").map(Number);
  const months = Array.from({ length: 6 }, (_, i) => {
    const dt = new Date(Date.UTC(y, m - 1 - (5 - i), 1));
    const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}`;
    return { key, label: `${dt.getUTCMonth() + 1}월`, count: logs.filter((l) => l.diveDate.startsWith(key)).length };
  });

  const trend = Object.fromEntries(
    DISCIPLINES.map(({ key }) => [
      key,
      logs
        .filter((l) => recordOf(l, key) != null)
        .map((l) => ({ date: l.diveDate, v: recordOf(l, key)! }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-12),
    ]),
  ) as Record<DisciplineKey, { date: string; v: number }[]>;

  return { total: logs.length, best, months, trend };
}
