// 구글 캘린더 'DEEPTAIL 교육일정' → 앱 일정 자동 입력 (캘린더 → 앱 한 방향)
// - 캘린더의 '비공개 주소(iCal 형식)'를 읽어서 오늘 전후 일정을 앱 일정(schedules)에 맞춰 둠
// - 일정 이름으로 종류·장소를 판단 (아래 classify)
// - 교육생 이름이 들어간 수업 일정은 앱에서 '수업 예약됨'으로만 보임 (원래 제목은 관리자만)
//
// 필요 환경변수: GOOGLE_CALENDAR_ICS_URL
import ICAL from "ical.js";
import { and, asc, eq, gte, inArray, isNotNull, notInArray, sql } from "drizzle-orm";
import { db, tables } from "@/db";
import { addDays, kst, todayYmd } from "./time";

const { schedules, locations, registrations, appSettings, users } = tables;

const SYNC_KEY = "gcal.lastSync";
const PAST_DAYS = 1;
const FUTURE_DAYS = 90;
const AUTO_SYNC_MINUTES = 10;

type ScheduleType = (typeof schedules.$inferInsert)["type"];

export const gcalEnabled = () => Boolean(process.env.GOOGLE_CALENDAR_ICS_URL);

// 일정 이름 속 장소 줄임말 → 앱 장소 이름
const PLACES: { re: RegExp; name: string }[] = [
  { re: /수원/, name: "수원월드컵경기장" },
  { re: /성남/, name: "성남 아쿠아라인" },
  { re: /딥스/, name: "딥스테이션" },
  { re: /올팍|올림픽/, name: "올림픽파크" },
  { re: /오산|tsn/i, name: "오산 TSN" },
  { re: /파라/, name: "파라다이브" },
  { re: /잠실|kua/i, name: "잠실 KUA 다이빙풀" },
  { re: /대전/, name: "대전" },
];

const CLASS_WORDS = /체험|아이다|aida|레벨|\d\s*차|이론|반\b|반$|수업|강습|교육/i;

export type Classified = {
  type: ScheduleType;
  title: string; // 앱에 보이는 제목 (수업은 이름 없이)
  place: string | null;
  known: boolean; // 규칙에 딱 맞았는지 (아니면 관리자 화면 '확인 필요')
};

/** 캘린더 일정 이름 → 앱 일정 종류. 취소된 일정은 null */
export function classify(summary: string): Classified | null {
  const s = summary.trim();
  if (!s || /취소/.test(s)) return null;
  const place = PLACES.find((p) => p.re.test(s))?.name ?? null;

  if (/휴관|휴장/.test(s)) return { type: "CLOSURE", title: `${place ?? s.replace(/\s*휴관|\s*휴장/, "")} 휴관`, place, known: true };
  if (/정트|정기\s*트레이닝/.test(s)) return { type: "REGULAR_TRAINING", title: "정기트레이닝", place, known: true };
  if (/자율/.test(s)) return { type: "SELF_PRACTICE", title: "자율연습반", place, known: true };
  if (/투어/.test(s)) return { type: "OVERSEAS_TOUR", title: s, place, known: true };
  if (/트레이닝|트레닝|1\s*:\s*[12]/.test(s)) return { type: "PAID_TRAINING", title: "유료트레이닝", place, known: true };
  // 그 밖의 일정은 모두 '강사가 바쁜 시간'으로 보고 이름 없이 '수업 예약됨'
  // '이름 + 장소'(예: 김주윤 딥스)도 수업으로 봄
  return { type: "REGULAR_CLASS", title: "정규수업", place, known: CLASS_WORDS.test(s) || place !== null };
}

type Occurrence = { key: string; summary: string; startsAt: Date; endsAt: Date };

const ymdOf = (t: ICAL.Time) =>
  `${t.year}-${String(t.month).padStart(2, "0")}-${String(t.day).padStart(2, "0")}`;

/** 종일 일정은 한국 날짜 0시 기준, 시간 일정은 캘린더 시간대 그대로 */
function toDate(t: ICAL.Time): Date {
  return t.isDate ? kst(ymdOf(t)) : t.toJSDate();
}

/** iCal 텍스트 → 기간 안의 일정 회차 목록 (반복 일정 펼침, 바뀐 회차·삭제된 회차 반영) */
export function expandIcs(text: string, from: Date, to: Date): Occurrence[] {
  const root = new ICAL.Component(ICAL.parse(text));
  for (const tz of root.getAllSubcomponents("vtimezone")) {
    ICAL.TimezoneService.register(new ICAL.Timezone(tz));
  }

  const masters = new Map<string, ICAL.Component>();
  const exceptions = new Map<string, ICAL.Component[]>();
  for (const ve of root.getAllSubcomponents("vevent")) {
    const uid = String(ve.getFirstPropertyValue("uid") ?? "");
    if (ve.hasProperty("recurrence-id")) {
      exceptions.set(uid, [...(exceptions.get(uid) ?? []), ve]);
    } else {
      masters.set(uid, ve);
    }
  }

  const out: Occurrence[] = [];
  const push = (uid: string, item: ICAL.Event, start: ICAL.Time, end: ICAL.Time) => {
    if (String(item.component.getFirstPropertyValue("status") ?? "").toUpperCase() === "CANCELLED") return;
    const startsAt = toDate(start);
    let endsAt = toDate(end ?? start);
    if (endsAt <= startsAt) endsAt = new Date(startsAt.getTime() + (start.isDate ? 86_400_000 : 3_600_000));
    if (endsAt <= from || startsAt >= to) return;
    out.push({ key: `${uid}|${startsAt.toISOString()}`, summary: item.summary ?? "", startsAt, endsAt });
  };

  for (const [uid, ve] of masters) {
    const ev = new ICAL.Event(ve);
    for (const ex of exceptions.get(uid) ?? []) ev.relateException(ex);
    if (!ev.isRecurring()) {
      push(uid, ev, ev.startDate, ev.endDate);
      continue;
    }
    const it = ev.iterator();
    let guard = 0;
    for (let next = it.next(); next && guard < 5000; next = it.next(), guard++) {
      if (toDate(next) >= to) break;
      const d = ev.getOccurrenceDetails(next);
      push(uid, d.item, d.startDate, d.endDate);
    }
  }
  // 반복 없이 바뀐 회차만 있는 경우(원본이 기간 밖 등)
  for (const [uid, list] of exceptions) {
    if (masters.has(uid)) continue;
    for (const ve of list) {
      const ev = new ICAL.Event(ve);
      push(uid, ev, ev.startDate, ev.endDate);
    }
  }
  return out;
}

export type GcalSyncResult = {
  at: string;
  ok: boolean;
  imported: number;
  removed: number;
  unknown: string[]; // 규칙에 안 맞은 일정 이름 (확인용)
  error?: string;
};

async function locationIds(names: string[]) {
  const need = [...new Set(names)];
  if (!need.length) return new Map<string, string>();
  const found = await db.select().from(locations).where(inArray(locations.name, need));
  const missing = need.filter((n) => !found.some((f) => f.name === n));
  if (missing.length) {
    const added = await db
      .insert(locations)
      .values(missing.map((name) => ({ name, sortOrder: 90 })))
      .onConflictDoNothing()
      .returning();
    found.push(...added);
  }
  return new Map(found.map((f) => [f.name, f.id]));
}

/** 캘린더를 읽어서 앱 일정에 반영 */
export async function syncCalendar({ fresh = true }: { fresh?: boolean } = {}): Promise<GcalSyncResult> {
  const at = new Date().toISOString();
  let result: GcalSyncResult;
  try {
    const url = process.env.GOOGLE_CALENDAR_ICS_URL;
    if (!url) throw new Error("GOOGLE_CALENDAR_ICS_URL 환경변수가 없어요");
    const res = await fetch(url, {
      ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: 300 } }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`캘린더 주소 응답 ${res.status} (비공개 주소가 맞는지 확인해 주세요)`);
    const text = await res.text();
    if (!text.includes("BEGIN:VCALENDAR")) throw new Error("캘린더 주소가 iCal 형식이 아니에요");

    const today = todayYmd();
    const from = kst(addDays(today, -PAST_DAYS));
    const to = kst(addDays(today, FUTURE_DAYS));
    const occ = expandIcs(text, from, to);

    const rows = occ
      .map((o) => ({ o, c: classify(o.summary) }))
      .filter((x): x is { o: Occurrence; c: Classified } => x.c !== null);
    const unknown = [...new Set(rows.filter((x) => !x.c.known).map((x) => x.o.summary.trim()))];

    const [admin] = await db
      .select()
      .from(users)
      .where(eq(users.role, "ADMIN"))
      .orderBy(asc(users.createdAt))
      .limit(1);
    if (!admin) throw new Error("관리자 계정이 없어요");
    const locIds = await locationIds(rows.map((x) => x.c.place).filter((p): p is string => !!p));

    const values = rows.map(({ o, c }) => ({
      type: c.type,
      title: c.title,
      locationId: c.place ? (locIds.get(c.place) ?? null) : null,
      startsAt: o.startsAt,
      endsAt: o.endsAt,
      minLevel: c.type === "REGULAR_TRAINING" || c.type === "SELF_PRACTICE" ? 2 : null,
      note: "",
      createdById: admin.id,
      contactName: admin.name,
      contactPhone: admin.phone ?? "",
      externalId: o.key,
      externalTitle: o.summary.trim(),
    }));

    for (let i = 0; i < values.length; i += 200) {
      await db
        .insert(schedules)
        .values(values.slice(i, i + 200))
        .onConflictDoUpdate({
          target: schedules.externalId,
          set: {
            type: sql`excluded.type`,
            title: sql`excluded.title`,
            locationId: sql`excluded.location_id`,
            startsAt: sql`excluded.starts_at`,
            endsAt: sql`excluded.ends_at`,
            minLevel: sql`excluded.min_level`,
            externalTitle: sql`excluded.external_title`,
          },
        });
    }

    // 캘린더에서 지워졌거나 '취소'로 바뀐 일정은 앱에서도 지움 (이미 신청이 걸린 일정은 남김)
    const keep = values.map((v) => v.externalId);
    const stale = await db
      .select({ id: schedules.id })
      .from(schedules)
      .where(
        and(
          isNotNull(schedules.externalId),
          gte(schedules.endsAt, from),
          keep.length ? notInArray(schedules.externalId, keep) : sql`true`,
          sql`not exists (select 1 from ${registrations} r where r.schedule_id = ${schedules.id})`,
        ),
      );
    if (stale.length) {
      await db.delete(schedules).where(inArray(schedules.id, stale.map((s) => s.id)));
    }

    result = { at, ok: true, imported: values.length, removed: stale.length, unknown };
  } catch (e) {
    result = { at, ok: false, imported: 0, removed: 0, unknown: [], error: (e as Error).message };
  }
  await db
    .insert(appSettings)
    .values({ key: SYNC_KEY, value: JSON.stringify(result) })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: JSON.stringify(result) } });
  return result;
}

export async function lastCalendarSync(): Promise<GcalSyncResult | null> {
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, SYNC_KEY));
  return row ? (JSON.parse(row.value) as GcalSyncResult) : null;
}

/** 일정 화면을 만들 때 10분 넘게 안 읽었으면 한 번 읽음 */
export async function syncCalendarIfStale() {
  if (!gcalEnabled()) return;
  const last = await lastCalendarSync();
  if (last && Date.now() - new Date(last.at).getTime() < AUTO_SYNC_MINUTES * 60_000) return;
  await syncCalendar({ fresh: false });
}
