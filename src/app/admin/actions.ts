"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, tables } from "@/db";
import { getRequest } from "@/lib/requests";
import { requireAdmin, requireStaff } from "@/lib/staff";
import { kst } from "@/lib/time";

const { registrations: r, enrollments: e } = tables;

function done(msg: string, path = "/admin"): never {
  revalidatePath("/", "layout");
  redirect(`${path}?msg=${encodeURIComponent(msg)}`);
}

// ─────────────── 신청 처리 ───────────────

export async function approveRequest(id: string) {
  const session = await requireStaff();
  const req = await getRequest(id);
  if (!req || req.status !== "PENDING") done("이미 처리된 신청이에요.");

  // 정규수업은 담당강사(또는 대표)만 승인
  if (
    req.kind === "REGULAR_CLASS" &&
    session.user.role !== "ADMIN" &&
    req.enrollmentInstructorId &&
    req.enrollmentInstructorId !== session.user.id
  ) {
    done("담당강사만 승인할 수 있어요.");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(r)
      .set({ status: "APPROVED", approvedById: session.user.id, approvedAt: new Date() })
      .where(and(eq(r.id, id), eq(r.status, "PENDING")));
    // 담당강사가 아직 없으면 승인한 사람을 담당강사로 지정
    if (req.kind === "REGULAR_CLASS" && req.enrollmentId && !req.enrollmentInstructorId) {
      await tx.update(e).set({ instructorId: session.user.id }).where(eq(e.id, req.enrollmentId));
    }
  });
  done(`${req.studentName}님 신청을 확정했어요.`);
}

export async function rejectRequest(id: string) {
  await requireStaff();
  const req = await getRequest(id);
  if (!req || !["PENDING", "APPROVED"].includes(req.status)) done("이미 처리된 신청이에요.");
  await db.update(r).set({ status: "REJECTED" }).where(eq(r.id, id));
  done(`${req.studentName}님 신청을 반려했어요.`);
}

export async function cancelRequest(id: string) {
  await requireStaff();
  const req = await getRequest(id);
  if (!req || req.status !== "APPROVED") done("확정된 신청만 취소할 수 있어요.");
  await db.update(r).set({ status: "CANCELLED" }).where(eq(r.id, id));
  done(`${req.studentName}님 일정을 취소했어요.`);
}

export async function markPaid(id: string) {
  await requireAdmin();
  const req = await getRequest(id);
  if (!req || req.paymentStatus !== "UNPAID") done("이미 처리된 신청이에요.");
  await db.transaction(async (tx) => {
    await tx.update(r).set({ paymentStatus: "PAID", paidAt: new Date() }).where(eq(r.id, id));
    // 과정 등록과 함께 낸 교육비면 수강권도 결제완료
    if (req.enrollmentId && (req.fee ?? 0) > 0) {
      await tx.update(e).set({ paymentStatus: "PAID" }).where(eq(e.id, req.enrollmentId));
    }
  });
  done(`${req.studentName}님 입금을 확인했어요.`);
}

export async function completeRequest(id: string) {
  await requireStaff();
  const req = await getRequest(id);
  if (!req || req.status !== "APPROVED") done("확정된 신청만 수업 완료로 바꿀 수 있어요.");
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(r)
      .set({ status: "COMPLETED" })
      .where(and(eq(r.id, id), eq(r.status, "APPROVED")))
      .returning({ id: r.id });
    // 정규수업이면 수강 횟수 1회 차감 (중복 처리 방지: 위 update가 성공했을 때만)
    if (updated.length && req.kind === "REGULAR_CLASS" && req.enrollmentId) {
      await tx
        .update(e)
        .set({ usedSessions: sql`least(${e.usedSessions} + 1, ${e.totalSessions})` })
        .where(eq(e.id, req.enrollmentId));
    }
  });
  done(`${req.studentName}님 수업을 완료 처리했어요.`);
}

// ─────────────── 일정 ───────────────

const scheduleSchema = z
  .object({
    type: z.enum(["SELF_PRACTICE", "REGULAR_TRAINING", "OVERSEAS_TOUR", "REGULAR_CLASS", "PAID_TRAINING"]),
    title: z.string().trim().min(1, "제목을 입력해 주세요.").max(60),
    locationId: z.string().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜를 선택해 주세요."),
    endDate: z.string().optional(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "시작 시간을 입력해 주세요."),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "종료 시간을 입력해 주세요."),
    capacity: z.coerce.number().int().min(1).max(100).optional().or(z.literal("").transform(() => undefined)),
    fee: z.coerce.number().int().min(0).optional().or(z.literal("").transform(() => undefined)),
    note: z.string().trim().max(300).optional(),
    repeatWeeks: z.coerce.number().int().min(1).max(12).default(1),
  });

export type FormState = { error?: string; ok?: string; at?: number };

export async function createSchedule(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireStaff();
  const parsed = scheduleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;

  const [me] = await db.select().from(tables.users).where(eq(tables.users.id, session.user.id));
  const endDate = v.endDate && /^\d{4}-\d{2}-\d{2}$/.test(v.endDate) ? v.endDate : v.date;
  const firstStart = kst(v.date, v.startTime);
  const firstEnd = kst(endDate, v.endTime);
  if (firstEnd <= firstStart) return { error: "종료 시간이 시작 시간보다 늦어야 해요." };

  // 같은 요일·시간으로 n주 반복 등록 (자율연습·정기트레이닝용)
  const week = 7 * 86_400_000;
  const rows = Array.from({ length: v.repeatWeeks }, (_, i) => ({
    type: v.type,
    title: v.title,
    locationId: v.locationId || null,
    startsAt: new Date(firstStart.getTime() + i * week),
    endsAt: new Date(firstEnd.getTime() + i * week),
    capacity: v.capacity ?? null,
    fee: v.fee || null,
    minLevel: v.type === "SELF_PRACTICE" || v.type === "REGULAR_TRAINING" ? 2 : null,
    note: v.note ?? "",
    createdById: me.id,
    instructorId: me.role === "INSTRUCTOR" ? me.id : null,
    // 일정 생성 시 등록한 사람 이름·연락처 자동 입력
    contactName: me.name,
    contactPhone: me.phone,
  }));
  await db.insert(tables.schedules).values(rows);
  revalidatePath("/", "layout");
  return { ok: rows.length > 1 ? `일정 ${rows.length}개를 등록했어요.` : "일정을 등록했어요.", at: Date.now() };
}

export async function deleteSchedule(id: string) {
  await requireAdmin();
  const active = await db
    .select({ id: r.id })
    .from(r)
    .where(and(eq(r.scheduleId, id), inArray(r.status, ["PENDING", "APPROVED", "COMPLETED"])));
  if (active.length) {
    done(`신청자가 ${active.length}명 있어서 삭제할 수 없어요. 신청을 먼저 반려해 주세요.`, "/admin/schedules");
  }
  await db.delete(r).where(eq(r.scheduleId, id)); // 반려·취소된 신청 기록 정리
  await db.delete(tables.schedules).where(eq(tables.schedules.id, id));
  done("일정을 삭제했어요.", "/admin/schedules");
}

// ─────────────── 공지 ───────────────

const noticeSchema = z.object({
  category: z.enum(["TOUR", "EVENT", "GENERAL"]),
  title: z.string().trim().min(1, "제목을 입력해 주세요.").max(80),
  summary: z.string().trim().max(80).optional(),
  body: z.string().trim().max(3000).optional(),
  pinned: z.literal("on").optional(),
});

export async function createNotice(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const parsed = noticeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  await db.insert(tables.notices).values({
    category: v.category,
    title: v.title,
    summary: v.summary ?? "",
    body: v.body ?? "",
    pinned: !!v.pinned,
    authorId: session.user.id,
  });
  revalidatePath("/", "layout");
  return { ok: "공지를 등록했어요.", at: Date.now() };
}

export async function deleteNotice(id: string) {
  await requireAdmin();
  await db.delete(tables.notices).where(eq(tables.notices.id, id));
  done("공지를 삭제했어요.", "/admin/notices");
}
