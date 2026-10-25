// 딥테일 프리다이빙 앱 데이터 구조 (Drizzle ORM + PostgreSQL)
import {
  pgTable,
  pgEnum,
  text,
  integer,
  boolean,
  timestamp,
  real,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

// ─────────────── 회원 ───────────────

// STUDENT 교육생 · INSTRUCTOR 강사(정규수업 승인) · ADMIN 대표(모든 권한)
export const roleEnum = pgEnum("role", ["STUDENT", "INSTRUCTOR", "ADMIN"]);

export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  role: roleEnum("role").notNull().default("STUDENT"),
  // 만 14세 미만이면 보호자 동의 필요 (동의 절차는 추후 확정)
  birthDate: timestamp("birth_date", { mode: "date" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// ─────────────── 교육과정 · 수강권 ───────────────

export const courses = pgTable("courses", {
  id: id(),
  code: text("code").notNull().unique(), // TRIAL, AIDA1~AIDA4
  name: text("name").notNull(),
  summary: text("summary").notNull().default(""),
  description: text("description").notNull().default(""),
  levelLabel: text("level_label").notNull().default(""), // 입문, 레벨 2 …
  sessionCount: integer("session_count"), // 수업 횟수 = n일 과정 (미정이면 null)
  price: integer("price"), // 원 단위 (미정이면 null)
  rentalSeparate: boolean("rental_separate").notNull().default(false), // true = 장비대여 별도
  rentalFee: integer("rental_fee"), // 과정 단위 장비대여료 (체험 20,000원)
  rentalItemsNote: text("rental_items_note").notNull().default(""), // 대여 품목 안내
  benefits: text("benefits").array().notNull().default([]), // 장비대여료·자격증 발급비 무료 등
  goals: text("goals").array().notNull().default([]), // 교육 목표
  audience: text("audience").array().notNull().default([]), // 추천 대상
  companionDiscount: integer("companion_discount"), // 동반 등록 할인액
  validityMonths: integer("validity_months"), // 교육 유효기간 (개월)
  practiceFromSession: integer("practice_from_session"), // n회차 이후 자율연습반·정기트레이닝 참여
  upgradeNote: text("upgrade_note").notNull().default(""), // 연계 혜택
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

// 과정 회차별 구성
export const courseSessions = pgTable(
  "course_sessions",
  {
    id: id(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    seq: integer("seq").notNull(), // 1회차, 2회차 …
    items: text("items").array().notNull(), // 이론 교육 (2~3시간), 5m 풀장 교육 (3시간)
    detail: text("detail").notNull().default(""), // 스테틱, 다이나믹, 렁스트레칭
  },
  (t) => [index("course_sessions_course_idx").on(t.courseId, t.seq)],
);

export const paymentStatusEnum = pgEnum("payment_status", [
  "NOT_REQUIRED", // 무료
  "UNPAID", // 미결제 (계좌이체 대기)
  "PAID", // 결제완료 (관리자가 입금 확인)
]);

// 횟수권: 교육생이 등록한 과정 1건
export const enrollments = pgTable(
  "enrollments",
  {
    id: id(),
    studentId: text("student_id").notNull().references(() => users.id),
    courseId: text("course_id").notNull().references(() => courses.id),
    instructorId: text("instructor_id").references(() => users.id), // 담당강사: 정규수업 신청 승인
    totalSessions: integer("total_sessions").notNull(),
    usedSessions: integer("used_sessions").notNull().default(0), // 수업 완료 처리 시에만 증가
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("UNPAID"),
    createdAt: createdAt(),
  },
  (t) => [index("enrollments_student_idx").on(t.studentId)],
);

// 유료트레이닝 옵션: 1:1/1:2 × 5m/딥스
export const trainingOptions = pgTable("training_options", {
  id: id(),
  code: text("code").notNull().unique(), // PT_1_1_5M 등
  name: text("name").notNull(), // 예) 1:1 트레이닝 5m
  participants: integer("participants").notNull(), // 1 = 1:1, 2 = 1:2
  venue: text("venue").notNull(), // 5m / 딥스
  price: integer("price").notNull(), // 1인 요금, 장비대여 별도
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

// 장비 대여 품목
export const rentalItems = pgTable("rental_items", {
  id: id(),
  code: text("code").notNull().unique(), // MASK_SNORKEL, LONG_FIN, WEIGHT, SUIT
  name: text("name").notNull(),
  price: integer("price"), // null = 현장결제
  payOnSite: boolean("pay_on_site").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ─────────────── 장소 · 일정 ───────────────

export const locations = pgTable("locations", {
  id: id(),
  name: text("name").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const scheduleTypeEnum = pgEnum("schedule_type", [
  "SELF_PRACTICE", // 자율연습반 (레벨2 이상, 무료)
  "REGULAR_TRAINING", // 정기트레이닝 주1회 (레벨2 이상, 무료)
  "REGULAR_CLASS", // 정규수업 (횟수권 차감)
  "PAID_TRAINING", // 유료트레이닝
  "OVERSEAS_TOUR", // 해외투어
]);

export const schedules = pgTable(
  "schedules",
  {
    id: id(),
    type: scheduleTypeEnum("type").notNull(),
    title: text("title").notNull(),
    locationId: text("location_id").references(() => locations.id),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    capacity: integer("capacity"),
    fee: integer("fee"), // 원 단위, 무료면 null
    minLevel: integer("min_level"), // 자율연습·정기트레이닝은 2
    note: text("note").notNull().default(""),
    createdById: text("created_by_id").notNull().references(() => users.id),
    instructorId: text("instructor_id").references(() => users.id),
    // 일정 생성 시 관리자 이름·연락처 자동 입력
    contactName: text("contact_name").notNull(),
    contactPhone: text("contact_phone").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("schedules_starts_idx").on(t.startsAt)],
);

// ─────────────── 신청 ───────────────

export const registrationKindEnum = pgEnum("registration_kind", [
  "JOIN_SESSION", // 자율연습·정기트레이닝·투어 참여
  "REGULAR_CLASS", // 빈 시간 정규수업 신청 → 담당강사 승인 필요
  "PAID_TRAINING", // 빈 시간 유료트레이닝 신청
]);

export const registrationStatusEnum = pgEnum("registration_status", [
  "PENDING", // 승인 대기
  "APPROVED", // 확정
  "REJECTED", // 반려
  "CANCELLED", // 취소
  "COMPLETED", // 수업 완료 (정규수업이면 횟수 차감)
]);

export const registrations = pgTable(
  "registrations",
  {
    id: id(),
    kind: registrationKindEnum("kind").notNull(),
    status: registrationStatusEnum("status").notNull().default("PENDING"),
    studentId: text("student_id").notNull().references(() => users.id),
    scheduleId: text("schedule_id").references(() => schedules.id), // 기존 일정 참여 시
    enrollmentId: text("enrollment_id").references(() => enrollments.id), // 정규수업이면 차감할 횟수권

    // 빈 시간에 신청할 때 원하는 장소·시간
    locationId: text("location_id").references(() => locations.id),
    requestedStartsAt: timestamp("requested_starts_at", { withTimezone: true }),
    requestedEndsAt: timestamp("requested_ends_at", { withTimezone: true }),

    // 교육비 · 결제 (앱 밖 계좌이체, 앱은 상태만 관리)
    fee: integer("fee"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("UNPAID"),
    paidAt: timestamp("paid_at", { withTimezone: true }),

    // 유료트레이닝이면 선택한 옵션 (1:1/1:2 · 5m/딥스)
    trainingOptionId: text("training_option_id").references(() => trainingOptions.id),

    // 장비 대여 (요금은 rental_items 참조, 슈트는 현장결제)
    rentMaskSnorkel: boolean("rent_mask_snorkel").notNull().default(false),
    rentLongFin: boolean("rent_long_fin").notNull().default(false),
    rentWeight: boolean("rent_weight").notNull().default(false),
    rentSuit: boolean("rent_suit").notNull().default(false),
    finSize: text("fin_size"), // 발 사이즈 (mm)
    weightKg: integer("weight_kg"),
    rentalFee: integer("rental_fee"), // 신청 시점 장비대여료 합계 (슈트 제외)

    approvedById: text("approved_by_id").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    memo: text("memo").notNull().default(""),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("registrations_student_idx").on(t.studentId),
    index("registrations_status_idx").on(t.status),
  ],
);

// ─────────────── 공지 ───────────────

export const noticeCategoryEnum = pgEnum("notice_category", ["TOUR", "EVENT", "GENERAL"]);

export const notices = pgTable(
  "notices",
  {
    id: id(),
    category: noticeCategoryEnum("category").notNull().default("GENERAL"),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""), // 홈 카드 한 줄
    body: text("body").notNull().default(""),
    pinned: boolean("pinned").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
    authorId: text("author_id").notNull().references(() => users.id),
  },
  (t) => [index("notices_published_idx").on(t.publishedAt)],
);

// ─────────────── 로그북 ───────────────
// 노션 로그북 DB 항목 확인 후 필드 확정 예정

export const disciplineEnum = pgEnum("discipline", [
  "STA",
  "DYN",
  "DNF",
  "CWT",
  "FIM",
  "CNF",
  "FUN",
]);

export const logbookEntries = pgTable(
  "logbook_entries",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: timestamp("date", { mode: "date" }).notNull(),
    locationId: text("location_id").references(() => locations.id),
    locationText: text("location_text"), // 고정 장소 외 (해외 등)
    discipline: disciplineEnum("discipline").notNull(),
    timeSec: integer("time_sec"),
    distanceM: integer("distance_m"),
    depthM: real("depth_m"),
    conditionNote: text("condition_note").notNull().default(""), // 호흡충동·컨트렉션·수축 메모
    instructorComment: text("instructor_comment").notNull().default(""),
    instructorId: text("instructor_id").references(() => users.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("logbook_user_date_idx").on(t.userId, t.date)],
);

// ─────────────── 관계 ───────────────

export const noticesRelations = relations(notices, ({ one }) => ({
  author: one(users, { fields: [notices.authorId], references: [users.id] }),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  course: one(courses, { fields: [enrollments.courseId], references: [courses.id] }),
  student: one(users, { fields: [enrollments.studentId], references: [users.id] }),
}));
