import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq, inArray, sql } from "drizzle-orm";
import { db, tables } from "./index";
import { courseData } from "./course-data";

async function main() {
  // 대표(관리자) 계정 — 배포 환경에서는 SEED_ADMIN_EMAIL · SEED_ADMIN_PASSWORD 필수
  const isProd = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  if (isProd && (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD)) {
    throw new Error("배포 환경에서는 SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD 환경변수를 설정해야 합니다.");
  }
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@deeptail.local").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "changeme1234";

  await db
    .insert(tables.users)
    .values({
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      name: "딥테일 대표",
      phone: "010-0000-0000",
      role: "ADMIN",
    })
    .onConflictDoNothing();
  const [admin] = await db.select().from(tables.users).where(eq(tables.users.email, adminEmail));

  // 고정 연습 장소 7곳
  const locationNames = [
    "수원월드컵경기장",
    "성남 아쿠아라인",
    "오산 TSN",
    "파라다이브",
    "딥스테이션",
    "잠실 KUA 다이빙풀",
    "올림픽파크",
  ];
  await db
    .insert(tables.locations)
    .values(locationNames.map((name, i) => ({ name, sortOrder: i })))
    .onConflictDoNothing();

  // 교육과정 — 교육과정 안내문 기준 (course-data.ts)
  for (const [i, { sessions = [], ...c }] of courseData.entries()) {
    const row = {
      summary: "",
      levelLabel: "",
      rentalSeparate: false,
      rentalFee: null,
      rentalItemsNote: "",
      benefits: [],
      goals: [],
      audience: [],
      companionDiscount: null,
      validityMonths: null,
      practiceFromSession: null,
      upgradeNote: "",
      sessionCount: null,
      ...c,
      sortOrder: i,
    };
    const { code, ...updatable } = row;
    const [course] = await db
      .insert(tables.courses)
      .values(row)
      .onConflictDoUpdate({ target: tables.courses.code, set: updatable })
      .returning();
    void code;
    // 회차 구성은 매번 새로 덮어씀
    await db.delete(tables.courseSessions).where(eq(tables.courseSessions.courseId, course.id));
    if (sessions.length) {
      await db.insert(tables.courseSessions).values(
        sessions.map((s, n) => ({ courseId: course.id, seq: n + 1, items: s.items, detail: s.detail ?? "" })),
      );
    }
  }

  // 유료트레이닝 (1인 요금, 장비대여 별도)
  const trainingRows = [
    { code: "PT_1_1_5M", name: "1:1 트레이닝 5m", participants: 1, venue: "5m", price: 60_000 },
    { code: "PT_1_2_5M", name: "1:2 트레이닝 5m", participants: 2, venue: "5m", price: 40_000 },
    { code: "PT_1_1_DEEP", name: "1:1 트레이닝 딥스", participants: 1, venue: "딥스", price: 80_000 },
    { code: "PT_1_2_DEEP", name: "1:2 트레이닝 딥스", participants: 2, venue: "딥스", price: 60_000 },
  ];
  for (const [i, t] of trainingRows.entries()) {
    await db
      .insert(tables.trainingOptions)
      .values({ ...t, sortOrder: i })
      .onConflictDoUpdate({ target: tables.trainingOptions.code, set: { name: t.name, price: t.price, sortOrder: i } });
  }

  // 장비대여 품목 (슈트는 현장결제)
  const rentalRows = [
    { code: "MASK_SNORKEL", name: "마스크 · 스노클", price: 3_000 },
    { code: "LONG_FIN", name: "롱핀", price: 8_000 },
    { code: "WEIGHT", name: "웨이트", price: 5_000 },
    { code: "SUIT", name: "슈트", price: null, payOnSite: true },
  ];
  for (const [i, r] of rentalRows.entries()) {
    const row = { payOnSite: false, ...r, sortOrder: i };
    await db
      .insert(tables.rentalItems)
      .values(row)
      .onConflictDoUpdate({
        target: tables.rentalItems.code,
        set: { name: row.name, price: row.price, payOnSite: row.payOnSite, sortOrder: i },
      });
  }

  // 공지 예시
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(tables.notices);
  if (count === 0) {
    await db.insert(tables.notices).values({
      category: "TOUR",
      title: "이시가키 만타 프리다이빙 투어",
      summary: "11월 26일(목) ~ 29일(일)",
      body: "모집 인원과 마감일, 비용은 확정 후 안내드립니다.",
      pinned: true,
      authorId: admin.id,
    });
  }

  if (process.env.SEED_DEMO === "1") await seedDemo(admin.id);

  await removeDemoSchedules();
  console.log("시드 완료 — 관리자 계정:", adminEmail);
  process.exit(0);
}

/**
 * 테스트용 예시 데이터 (SEED_DEMO=1 일 때만)
 * - 자율연습 참여 가능한 테스트 교육생: demo@deeptail.local / demo1234 (AIDA 2, 2회차 완료)
 * 실제 운영 전에 SEED_DEMO를 지우고 관리자 화면에서 예시 일정을 삭제하세요.
 */
/** [예시] 일정과 거기에 걸린 신청을 지움 (배포할 때마다 실행, 없으면 아무 일 없음) */
async function removeDemoSchedules() {
  const demo = await db
    .select({ id: tables.schedules.id })
    .from(tables.schedules)
    .where(sql`${tables.schedules.title} like '[예시]%'`);
  if (!demo.length) return;
  const ids = demo.map((d) => d.id);
  await db.delete(tables.registrations).where(inArray(tables.registrations.scheduleId, ids));
  await db.delete(tables.schedules).where(inArray(tables.schedules.id, ids));
  console.log(`[예시] 일정 ${ids.length}건 삭제`);
}

async function seedDemo(adminId: string) {
  const [admin] = await db.select().from(tables.users).where(eq(tables.users.id, adminId));
  const locs = await db.select().from(tables.locations);
  const loc = (name: string) => locs.find((l) => l.name === name)!.id;

  // [예시] 일정은 더 이상 만들지 않음 (실제 일정은 구글 캘린더에서 가져옴)
  void admin;
  void loc;

  await db
    .insert(tables.users)
    .values({
      email: "demo@deeptail.local",
      passwordHash: await bcrypt.hash("demo1234", 10),
      name: "테스트교육생",
      phone: "010-1111-2222",
    })
    .onConflictDoNothing();
  const [demo] = await db.select().from(tables.users).where(eq(tables.users.email, "demo@deeptail.local"));
  const [aida2] = await db.select().from(tables.courses).where(eq(tables.courses.code, "AIDA2"));
  const has = await db.select().from(tables.enrollments).where(eq(tables.enrollments.studentId, demo.id));
  if (has.length === 0) {
    await db.insert(tables.enrollments).values({
      studentId: demo.id,
      courseId: aida2.id,
      instructorId: admin.id,
      totalSessions: 4,
      usedSessions: 2,
      paymentStatus: "PAID",
    });
  }
  console.log("예시 데이터 추가 — 테스트 교육생: demo@deeptail.local / demo1234");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
