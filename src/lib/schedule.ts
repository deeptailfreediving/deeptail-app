import { and, asc, eq, gt, inArray, lt, sql } from "drizzle-orm";
import { db, tables } from "@/db";
import { canJoinPractice } from "./eligibility";
import { kst } from "./time";

const { schedules, registrations, locations, enrollments, courses } = tables;

export const scheduleTypeLabel = {
  SELF_PRACTICE: "자율연습반",
  REGULAR_TRAINING: "정기트레이닝",
  REGULAR_CLASS: "정규수업",
  PAID_TRAINING: "유료트레이닝",
  OVERSEAS_TOUR: "해외투어",
} as const;

export const ACTIVE_STATUSES = ["PENDING", "APPROVED"] as const;

/** 하루 동안의 공개 일정 + 참여 인원 */
export async function listSchedulesOn(date: string) {
  return listSchedulesBetween(kst(date), kst(date, "23:59"));
}

/** 기간 안의 공개 일정 + 참여 인원 (일정 화면은 3주치를 한 번에 받아 날짜 전환을 즉시 처리) */
export async function listSchedulesBetween(from: Date, to: Date) {
  const rows = await db
    .select({
      id: schedules.id,
      type: schedules.type,
      title: schedules.title,
      startsAt: schedules.startsAt,
      endsAt: schedules.endsAt,
      capacity: schedules.capacity,
      fee: schedules.fee,
      note: schedules.note,
      location: locations.name,
      joined: sql<number>`(select count(*)::int from ${registrations} r where r.schedule_id = ${schedules.id} and r.status in ('PENDING','APPROVED'))`,
    })
    .from(schedules)
    .leftJoin(locations, eq(schedules.locationId, locations.id))
    .where(and(lt(schedules.startsAt, to), gt(schedules.endsAt, from)))
    .orderBy(asc(schedules.startsAt));
  return rows;
}

/** 하루 동안 이미 잡힌 수업 신청 (이름 없이 '예약됨'으로만 보여줌) */
export async function listBookedOn(date: string) {
  return listBookedBetween(kst(date), kst(date, "23:59"));
}

export async function listBookedBetween(from: Date, to: Date) {
  return db
    .select({
      id: registrations.id,
      startsAt: registrations.requestedStartsAt,
      endsAt: registrations.requestedEndsAt,
      location: locations.name,
    })
    .from(registrations)
    .leftJoin(locations, eq(registrations.locationId, locations.id))
    .where(
      and(
        inArray(registrations.kind, ["REGULAR_CLASS", "PAID_TRAINING"]),
        inArray(registrations.status, [...ACTIVE_STATUSES]),
        lt(registrations.requestedStartsAt, to),
        gt(registrations.requestedEndsAt, from),
      ),
    )
    .orderBy(asc(registrations.requestedStartsAt));
}

/** 요청한 시간이 기존 일정·수업 신청과 겹치는지 (강사 한 명 기준, 장소 무관) */
export async function hasConflict(start: Date, end: Date) {
  const [s] = await db
    .select({ id: schedules.id })
    .from(schedules)
    .where(
      and(
        inArray(schedules.type, ["REGULAR_CLASS", "PAID_TRAINING", "OVERSEAS_TOUR"]),
        lt(schedules.startsAt, end),
        gt(schedules.endsAt, start),
      ),
    )
    .limit(1);
  if (s) return true;
  const [r] = await db
    .select({ id: registrations.id })
    .from(registrations)
    .where(
      and(
        inArray(registrations.kind, ["REGULAR_CLASS", "PAID_TRAINING"]),
        inArray(registrations.status, [...ACTIVE_STATUSES]),
        lt(registrations.requestedStartsAt, end),
        gt(registrations.requestedEndsAt, start),
      ),
    )
    .limit(1);
  return Boolean(r);
}

/** 교육생의 수강권 + 남은 횟수 */
export async function listMyEnrollments(studentId: string) {
  const rows = await db
    .select({
      id: enrollments.id,
      totalSessions: enrollments.totalSessions,
      usedSessions: enrollments.usedSessions,
      paymentStatus: enrollments.paymentStatus,
      course: {
        code: courses.code,
        name: courses.name,
        practiceFromSession: courses.practiceFromSession,
      },
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .where(eq(enrollments.studentId, studentId))
    .orderBy(asc(enrollments.createdAt));
  // 신청 중(승인 대기·확정)인 회차는 남은 횟수에서 미리 빼고 보여줌
  const reserved = await db
    .select({ enrollmentId: registrations.enrollmentId, n: sql<number>`count(*)::int` })
    .from(registrations)
    .where(
      and(eq(registrations.studentId, studentId), inArray(registrations.status, [...ACTIVE_STATUSES])),
    )
    .groupBy(registrations.enrollmentId);
  return rows.map((e) => {
    const r = reserved.find((x) => x.enrollmentId === e.id)?.n ?? 0;
    return { ...e, reserved: r, available: e.totalSessions - e.usedSessions - r };
  });
}

export async function practiceEligible(studentId: string) {
  return canJoinPractice(await listMyEnrollments(studentId));
}

export async function getSchedule(id: string) {
  const [row] = await db
    .select({ s: schedules, location: locations.name })
    .from(schedules)
    .leftJoin(locations, eq(schedules.locationId, locations.id))
    .where(eq(schedules.id, id));
  return row ? { ...row.s, location: row.location } : null;
}
