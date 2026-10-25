"use server";

import { and, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, tables } from "@/db";
import { getSession } from "@/lib/auth";
import { rentalFee, rentalModeForCourse, type RentalChoice, type RentalMode } from "@/lib/fees";
import { ACTIVE_STATUSES, getSchedule, hasConflict, listMyEnrollments, practiceEligible } from "@/lib/schedule";
import { kst, SESSION_HOURS, START_TIMES, todayYmd } from "@/lib/time";

export type ApplyState = { error?: string };

const optionalText = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((v) => v || undefined);

const base = z.object({
  rent_MASK_SNORKEL: z.literal("on").optional(),
  rent_LONG_FIN: z.literal("on").optional(),
  rent_WEIGHT: z.literal("on").optional(),
  rent_SUIT: z.literal("on").optional(),
  rentPackage: z.literal("on").optional(),
  finSize: optionalText,
  weightKg: z.coerce.number().int().min(10).max(200).optional().or(z.literal("").transform(() => undefined)),
  memo: optionalText,
});

const joinSchema = base.extend({ mode: z.literal("join"), scheduleId: z.string().min(1) });

const requestSchema = base.extend({
  mode: z.literal("request"),
  kind: z.enum(["REGULAR_CLASS", "PAID_TRAINING"], { message: "신청 과정을 선택해 주세요." }),
  enrollmentId: z.string().optional(), // 기존 수강권 id 또는 "new"
  courseCode: z.string().optional(),
  trainingOptionId: z.string().optional(),
  locationId: z.string().min(1, "장소를 선택해 주세요."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜를 선택해 주세요."),
  startTime: z.enum(START_TIMES as [string, ...string[]], { message: "시작 시간을 선택해 주세요." }),
});

const schema = z.discriminatedUnion("mode", [joinSchema, requestSchema]);

function rentalFields(v: z.infer<typeof base>) {
  const choice: RentalChoice = {
    MASK_SNORKEL: !!v.rent_MASK_SNORKEL,
    LONG_FIN: !!v.rent_LONG_FIN,
    WEIGHT: !!v.rent_WEIGHT,
    SUIT: !!v.rent_SUIT,
  };
  return { choice, packagePicked: !!v.rentPackage };
}

async function rentalColumns(mode: RentalMode, v: z.infer<typeof base>) {
  const items = await db.select().from(tables.rentalItems);
  const { choice, packagePicked } = rentalFields(v);
  const all = mode.kind === "package" && packagePicked;
  const anyRental = all || Object.values(choice).some(Boolean);
  return {
    rentMaskSnorkel: all || !!choice.MASK_SNORKEL,
    rentLongFin: all || !!choice.LONG_FIN,
    rentWeight: all || !!choice.WEIGHT,
    rentSuit: all || !!choice.SUIT,
    finSize: anyRental ? v.finSize ?? null : null,
    weightKg: anyRental ? v.weightKg ?? null : null,
    rentalFee: rentalFee(mode, items, choice, packagePicked),
  };
}

export async function apply(_: ApplyState, formData: FormData): Promise<ApplyState> {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/schedule");
  const studentId = session.user.id;

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;

  let newId: string;

  if (v.mode === "join") {
    // ── 기존 일정 참여 (자율연습반 · 정기트레이닝 · 투어) ──
    const s = await getSchedule(v.scheduleId);
    if (!s) return { error: "일정을 찾을 수 없어요." };
    if (s.startsAt < new Date()) return { error: "이미 지난 일정이에요." };
    if (!["SELF_PRACTICE", "REGULAR_TRAINING", "OVERSEAS_TOUR"].includes(s.type)) {
      return { error: "이 일정은 참여 신청을 받지 않아요." };
    }
    if ((s.type === "SELF_PRACTICE" || s.type === "REGULAR_TRAINING") && !(await practiceEligible(studentId))) {
      return { error: "AIDA 2 · AIDA 3 수강생은 2회차 강습 이후부터 참여할 수 있어요." };
    }
    const existing = await db
      .select({ id: tables.registrations.id })
      .from(tables.registrations)
      .where(
        and(
          eq(tables.registrations.scheduleId, s.id),
          eq(tables.registrations.studentId, studentId),
          inArray(tables.registrations.status, [...ACTIVE_STATUSES]),
        ),
      );
    if (existing.length) return { error: "이미 신청한 일정이에요." };
    if (s.capacity != null) {
      const joined = await db
        .select({ id: tables.registrations.id })
        .from(tables.registrations)
        .where(
          and(eq(tables.registrations.scheduleId, s.id), inArray(tables.registrations.status, [...ACTIVE_STATUSES])),
        );
      if (joined.length >= s.capacity) return { error: "정원이 다 찼어요." };
    }

    const rental = await rentalColumns({ kind: "items" }, v);
    const fee = s.fee ?? 0;
    const [row] = await db
      .insert(tables.registrations)
      .values({
        kind: "JOIN_SESSION",
        // 자율연습·정기트레이닝은 바로 확정, 투어는 확인 후 확정
        status: s.type === "OVERSEAS_TOUR" ? "PENDING" : "APPROVED",
        studentId,
        scheduleId: s.id,
        locationId: s.locationId,
        fee,
        paymentStatus: fee + rental.rentalFee > 0 ? "UNPAID" : "NOT_REQUIRED",
        memo: v.memo ?? "",
        ...rental,
      })
      .returning({ id: tables.registrations.id });
    newId = row.id;
  } else {
    // ── 빈 시간에 정규수업 · 유료트레이닝 신청 ──
    if (v.date < todayYmd()) return { error: "지난 날짜는 선택할 수 없어요." };
    const start = kst(v.date, v.startTime);
    if (start < new Date()) return { error: "이미 지난 시간이에요." };
    const end = new Date(start.getTime() + SESSION_HOURS * 3600_000);

    const [loc] = await db.select().from(tables.locations).where(eq(tables.locations.id, v.locationId));
    if (!loc) return { error: "장소를 다시 선택해 주세요." };
    if (await hasConflict(start, end)) {
      return { error: "그 시간에는 이미 다른 수업이 있어요. 다른 시간을 골라 주세요." };
    }

    const common = {
      studentId,
      locationId: loc.id,
      requestedStartsAt: start,
      requestedEndsAt: end,
      status: "PENDING" as const, // 담당강사 승인 후 확정
      memo: v.memo ?? "",
    };

    if (v.kind === "PAID_TRAINING") {
      const [opt] = v.trainingOptionId
        ? await db.select().from(tables.trainingOptions).where(eq(tables.trainingOptions.id, v.trainingOptionId))
        : [];
      if (!opt) return { error: "트레이닝 종류를 선택해 주세요." };
      const rental = await rentalColumns({ kind: "items" }, v);
      const [row] = await db
        .insert(tables.registrations)
        .values({
          ...common,
          kind: "PAID_TRAINING",
          trainingOptionId: opt.id,
          fee: opt.price,
          paymentStatus: "UNPAID",
          ...rental,
        })
        .returning({ id: tables.registrations.id });
      newId = row.id;
    } else {
      // 정규수업: 기존 수강권 사용 또는 새 과정 등록
      if (!v.enrollmentId) return { error: "수강권 또는 등록할 과정을 선택해 주세요." };
      const mine = await listMyEnrollments(studentId);

      if (v.enrollmentId === "new") {
        const [course] = v.courseCode
          ? await db.select().from(tables.courses).where(eq(tables.courses.code, v.courseCode))
          : [];
        if (!course || !course.isActive || course.price == null) return { error: "등록할 과정을 선택해 주세요." };
        if (mine.some((e) => e.course.code === course.code && e.available > 0)) {
          return { error: "이미 등록한 과정이에요. 남은 수강 횟수로 신청해 주세요." };
        }
        const mode = rentalModeForCourse(course);
        const rental = await rentalColumns(mode, v);
        newId = await db.transaction(async (tx) => {
          const [enr] = await tx
            .insert(tables.enrollments)
            .values({
              studentId,
              courseId: course.id,
              totalSessions: course.sessionCount ?? 1,
              paymentStatus: "UNPAID",
            })
            .returning({ id: tables.enrollments.id });
          const [row] = await tx
            .insert(tables.registrations)
            .values({
              ...common,
              kind: "REGULAR_CLASS",
              enrollmentId: enr.id,
              fee: course.price,
              paymentStatus: "UNPAID",
              ...rental,
            })
            .returning({ id: tables.registrations.id });
          return row.id;
        });
      } else {
        const enr = mine.find((e) => e.id === v.enrollmentId);
        if (!enr) return { error: "수강권을 다시 선택해 주세요." };
        if (enr.available <= 0) return { error: "남은 수강 횟수가 없어요." };
        const [course] = await db.select().from(tables.courses).where(eq(tables.courses.code, enr.course.code));
        const mode = rentalModeForCourse(course);
        const rental = await rentalColumns(mode, v);
        const [row] = await db
          .insert(tables.registrations)
          .values({
            ...common,
            kind: "REGULAR_CLASS",
            enrollmentId: enr.id,
            fee: 0, // 교육비는 과정 등록 시 납부
            paymentStatus: rental.rentalFee > 0 ? "UNPAID" : "NOT_REQUIRED",
            ...rental,
          })
          .returning({ id: tables.registrations.id });
        newId = row.id;
      }
    }
  }

  redirect(`/my/requests/${newId}`);
}
