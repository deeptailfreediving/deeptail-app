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

// ─────────────── 로그북 피드백 ───────────────

export async function reviewLog(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const session = await requireStaff();
  const feedback = String(formData.get("feedback") ?? "").trim().slice(0, 2000);
  const [before] = await db.select().from(tables.diveLogs).where(eq(tables.diveLogs.id, id));
  if (!before) return { error: "로그를 찾을 수 없어요." };
  await db
    .update(tables.diveLogs)
    .set({ feedback, reviewed: true, reviewedById: session.user.id, reviewedAt: new Date() })
    .where(eq(tables.diveLogs.id, id));
  revalidatePath("/", "layout");

  // 새 피드백이거나 내용이 바뀌었으면 교육생에게 푸시
  let pushed = 0;
  if (feedback && feedback !== before.feedback.trim()) {
    const { sendPush } = await import("@/lib/push");
    pushed = await sendPush([before.userId], {
      title: before.feedback ? "로그 피드백이 수정됐어요" : "로그에 강사 피드백이 달렸어요",
      body: feedback.length > 60 ? `${feedback.slice(0, 60)}…` : feedback,
      url: `/my/logbook/${id}`,
      tag: `log-${id}`,
    });
  }
  return {
    ok: (feedback ? "피드백을 남기고 확인완료했어요." : "확인완료했어요.") + (pushed ? ` (알림 ${pushed}건 전송)` : ""),
    at: Date.now(),
  };
}

// ─────────────── 로그 가져오기 (노션 → 앱) ───────────────

export async function importLogs(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const skipDup = formData.get("skipDuplicates") === "on";
  const [target] = userId ? await db.select().from(tables.users).where(eq(tables.users.id, userId)) : [];
  if (!target) return { error: "기록을 넣을 회원을 선택해 주세요." };

  // 파일 또는 붙여넣은 내용
  let raw = String(formData.get("json") ?? "").trim();
  const file = formData.get("file");
  // 서버 환경에 따라 File 클래스가 달라서 instanceof 대신 Blob 형태로 확인
  if (!raw && file && typeof file === "object" && "text" in file && file.size > 0) {
    if (file.size > 2_000_000) return { error: "파일이 너무 커요 (2MB 이하)." };
    raw = (await (file as Blob).text()).trim();
  }
  if (!raw) return { error: "가져오기 파일을 선택하거나 내용을 붙여넣어 주세요." };

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { error: "파일 형식을 읽을 수 없어요 (JSON)." };
  }
  const { importFile } = await import("@/lib/logImport");
  const parsed = importFile.safeParse(data);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return { error: `${i.path.join(".")} 항목을 확인해 주세요: ${i.message}` };
  }

  let records = parsed.data.records;
  if (skipDup) {
    const existing = await db
      .select({ diveDate: tables.diveLogs.diveDate, purpose: tables.diveLogs.purpose, place: tables.diveLogs.place })
      .from(tables.diveLogs)
      .where(eq(tables.diveLogs.userId, target.id));
    const key = (r: { diveDate: string; purpose: string; place: string }) => `${r.diveDate}|${r.purpose}|${r.place}`;
    const seen = new Set(existing.map(key));
    records = records.filter((r) => !seen.has(key(r)));
  }
  if (records.length === 0) return { ok: "새로 넣을 기록이 없어요 (모두 이미 있음).", at: Date.now() };

  const now = new Date();
  await db.insert(tables.diveLogs).values(
    records.map((r) => ({
      ...r,
      userId: target.id,
      reviewedById: r.reviewed ? session.user.id : null,
      reviewedAt: r.reviewed ? now : null,
    })),
  );
  revalidatePath("/", "layout");
  const skipped = parsed.data.records.length - records.length;
  return {
    ok: `${target.name}님 로그북에 ${records.length}건을 넣었어요.${skipped ? ` (중복 ${skipped}건 건너뜀)` : ""}`,
    at: Date.now(),
  };
}

// ─────────────── 노션 연동 ───────────────

export async function linkNotionStudent(userId: string, formData: FormData) {
  await requireAdmin();
  const pageId = String(formData.get("notionPageId") ?? "").replace(/-/g, "").toLowerCase();
  await db
    .update(tables.users)
    .set({ notionStudentPageId: /^[0-9a-f]{32}$/.test(pageId) ? pageId : null })
    .where(eq(tables.users.id, userId));
  done(pageId ? "노션 교육생과 연결했어요." : "연결을 해제했어요.", "/admin/notion");
}

export async function autoLinkByName() {
  await requireAdmin();
  const { listNotionStudents, normId } = await import("@/lib/notion");
  const students = await listNotionStudents();
  const users = await db.select().from(tables.users);
  let n = 0;
  for (const u of users) {
    if (u.notionStudentPageId) continue;
    const same = students.filter((s) => s.name.trim() === u.name.trim());
    if (same.length === 1) {
      await db.update(tables.users).set({ notionStudentPageId: normId(same[0].id) }).where(eq(tables.users.id, u.id));
      n++;
    }
  }
  done(n ? `이름이 같은 회원 ${n}명을 연결했어요.` : "새로 연결할 회원이 없어요 (이름이 같고 한 명뿐인 경우만 자동 연결).", "/admin/notion");
}

export async function seedNotionFeedback() {
  await requireAdmin();
  const { listRecentlyEditedVideos } = await import("@/lib/notion");
  const { notifyIfFeedbackChanged } = await import("@/lib/feedbackNotify");
  const videos = await listRecentlyEditedVideos(new Date(Date.now() - 3650 * 86_400_000).toISOString());
  for (const v of videos) await notifyIfFeedbackChanged(v, { seedOnly: true });
  done(`기존 강습영상 ${videos.length}건을 '알림 보냄' 상태로 기록했어요. 이제부터 새로 쓰는 피드백만 알림이 가요.`, "/admin/notion");
}

// ─────────────── 강습·투어 후기 ───────────────

export async function syncReviewsNow() {
  await requireStaff();
  const { syncReviews } = await import("@/lib/reviews");
  const r = await syncReviews();
  done(
    r.ok ? `네이버 카페에서 후기 ${r.found}건을 찾았고, 새 후기 ${r.added}건을 추가했어요.` : `가져오기 실패: ${r.error}`,
    "/admin/reviews",
  );
}

export async function toggleReviewHidden(id: string) {
  await requireStaff();
  await db.update(tables.reviews).set({ hidden: sql`not ${tables.reviews.hidden}` }).where(eq(tables.reviews.id, id));
  done("공개 상태를 바꿨어요.", "/admin/reviews");
}

export async function toggleReviewPinned(id: string) {
  await requireStaff();
  await db.update(tables.reviews).set({ pinned: sql`not ${tables.reviews.pinned}` }).where(eq(tables.reviews.id, id));
  done("추천(상단 고정)을 바꿨어요.", "/admin/reviews");
}

export async function toggleReviewCategory(id: string) {
  await requireStaff();
  await db
    .update(tables.reviews)
    .set({
      category: sql`case when ${tables.reviews.category} = 'TOUR' then 'LESSON'::review_category else 'TOUR'::review_category end`,
      categoryManual: true,
    })
    .where(eq(tables.reviews.id, id));
  done("분류를 바꿨어요.", "/admin/reviews");
}

export async function addReviewManually(formData: FormData) {
  await requireStaff();
  const { articleKeyOf, articleUrl, guessCategory } = await import("@/lib/reviews");
  const url = String(formData.get("url") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const category = formData.get("category") === "TOUR" ? "TOUR" : formData.get("category") === "LESSON" ? "LESSON" : null;
  const key = articleKeyOf(url);
  if (!key) done("딥테일 카페 글 주소가 아니에요. 카페 글을 열고 주소를 복사해 붙여넣어 주세요.", "/admin/reviews");
  if (!title) done("제목을 입력해 주세요.", "/admin/reviews");
  await db
    .insert(tables.reviews)
    .values({
      articleKey: key,
      url: articleUrl(key),
      title,
      excerpt: excerpt || null,
      category: category ?? guessCategory(title, excerpt),
      categoryManual: Boolean(category),
      source: "MANUAL",
    })
    .onConflictDoUpdate({
      target: tables.reviews.articleKey,
      set: { title, excerpt: excerpt || null, source: "MANUAL", hidden: false, ...(category ? { category, categoryManual: true } : {}) },
    });
  done("후기를 추가했어요.", "/admin/reviews");
}

// ─────────────── 구글 캘린더 ───────────────

export async function syncCalendarNow() {
  await requireStaff();
  const { syncCalendar } = await import("@/lib/gcal");
  const r = await syncCalendar();
  done(
    r.ok ? `캘린더 일정 ${r.imported}건을 반영했어요.${r.removed ? ` 지워진 일정 ${r.removed}건은 앱에서도 지웠어요.` : ""}` : `읽기 실패: ${r.error}`,
    "/admin/schedules",
  );
}

// ─────────────── 자격 승인 ───────────────

export async function approveLicense(id: string) {
  const session = await requireStaff();
  const [req] = await db.select().from(tables.licenseRequests).where(eq(tables.licenseRequests.id, id));
  if (!req || req.status !== "PENDING") done("이미 처리된 요청이에요.");
  await db.transaction(async (tx) => {
    await tx
      .update(tables.licenseRequests)
      .set({ status: "APPROVED", reviewedById: session.user.id, reviewedAt: new Date() })
      .where(eq(tables.licenseRequests.id, id));
    await tx
      .update(tables.users)
      .set({ licenseLevel: req.level, licenseAgency: req.agency })
      .where(eq(tables.users.id, req.userId));
  });
  done(`${req.agency} 레벨 ${req.level}로 승인했어요.`);
}

export async function rejectLicense(id: string, formData: FormData) {
  const session = await requireStaff();
  const note = String(formData.get("note") ?? "").trim().slice(0, 100);
  await db
    .update(tables.licenseRequests)
    .set({ status: "REJECTED", note, reviewedById: session.user.id, reviewedAt: new Date() })
    .where(and(eq(tables.licenseRequests.id, id), eq(tables.licenseRequests.status, "PENDING")));
  done("자격 요청을 반려했어요.");
}

// 후기 미리보기 사진: 직접 올리기 / 빼기
export async function setReviewImage(id: string, formData: FormData) {
  await requireStaff();
  const { saveUpload, uploadUrl } = await import("@/lib/uploads");
  const upId = await saveUpload("REVIEW", String(formData.get("image") ?? ""));
  if (!upId) done("사진을 골라 주세요.", "/admin/reviews");
  await db.update(tables.reviews).set({ imageUrl: uploadUrl(upId), imageChecked: true }).where(eq(tables.reviews.id, id));
  done("미리보기 사진을 바꿨어요.", "/admin/reviews");
}

export async function clearReviewImage(id: string) {
  await requireStaff();
  await db.update(tables.reviews).set({ imageUrl: null, imageChecked: true }).where(eq(tables.reviews.id, id));
  done("미리보기 사진을 뺐어요.", "/admin/reviews");
}
