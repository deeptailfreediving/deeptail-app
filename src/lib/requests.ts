import { and, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db, tables } from "@/db";
import { scheduleTypeLabel } from "./schedule";

const { registrations: r, schedules: s, locations: l, trainingOptions: t, enrollments: e, courses: c } = tables;
const sl = alias(l, "schedule_location");

export const statusLabel = {
  PENDING: "승인 대기",
  APPROVED: "확정",
  REJECTED: "반려",
  CANCELLED: "취소",
  COMPLETED: "수업 완료",
} as const;

export const paymentLabel = { NOT_REQUIRED: "결제 없음", UNPAID: "입금 대기", PAID: "결제완료" } as const;

function baseQuery() {
  return db
    .select({
      r,
      scheduleType: s.type,
      scheduleTitle: s.title,
      scheduleStart: s.startsAt,
      scheduleEnd: s.endsAt,
      scheduleLocation: sl.name,
      location: l.name,
      training: t.name,
      course: c.name,
    })
    .from(r)
    .leftJoin(s, eq(r.scheduleId, s.id))
    .leftJoin(sl, eq(s.locationId, sl.id))
    .leftJoin(l, eq(r.locationId, l.id))
    .leftJoin(t, eq(r.trainingOptionId, t.id))
    .leftJoin(e, eq(r.enrollmentId, e.id))
    .leftJoin(c, eq(e.courseId, c.id));
}

type Row = Awaited<ReturnType<typeof baseQuery>>[number];

function shape(x: Row) {
  const title =
    x.r.kind === "JOIN_SESSION"
      ? `${x.scheduleType ? scheduleTypeLabel[x.scheduleType] : "일정"} · ${x.scheduleTitle ?? ""}`
      : x.r.kind === "PAID_TRAINING"
        ? `유료트레이닝 · ${x.training ?? ""}`
        : `정규수업 · ${x.course ?? ""}`;
  return {
    ...x.r,
    title,
    startsAt: x.r.requestedStartsAt ?? x.scheduleStart,
    endsAt: x.r.requestedEndsAt ?? x.scheduleEnd,
    location: x.location ?? x.scheduleLocation,
    total: (x.r.fee ?? 0) + (x.r.rentalFee ?? 0),
  };
}

export async function getMyRequest(id: string, studentId: string) {
  const [row] = await baseQuery().where(and(eq(r.id, id), eq(r.studentId, studentId)));
  return row ? shape(row) : null;
}

export async function listMyRequests(studentId: string) {
  const rows = await baseQuery().where(eq(r.studentId, studentId)).orderBy(desc(r.createdAt)).limit(20);
  return rows.map(shape);
}
