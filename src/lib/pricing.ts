import { asc, eq } from "drizzle-orm";
import { db, tables } from "@/db";

export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export function listCourses() {
  return db
    .select()
    .from(tables.courses)
    .where(eq(tables.courses.isActive, true))
    .orderBy(asc(tables.courses.sortOrder));
}

export function listTrainingOptions() {
  return db
    .select()
    .from(tables.trainingOptions)
    .where(eq(tables.trainingOptions.isActive, true))
    .orderBy(asc(tables.trainingOptions.sortOrder));
}

export function listRentalItems() {
  return db.select().from(tables.rentalItems).orderBy(asc(tables.rentalItems.sortOrder));
}

export async function getCourseByCode(code: string) {
  const [course] = await db.select().from(tables.courses).where(eq(tables.courses.code, code));
  if (!course) return null;
  const sessions = await db
    .select()
    .from(tables.courseSessions)
    .where(eq(tables.courseSessions.courseId, course.id))
    .orderBy(asc(tables.courseSessions.seq));
  return { ...course, sessions };
}

export const durationLabel = (sessionCount: number | null) =>
  sessionCount != null ? `${sessionCount}일 과정` : "[과정 구성 준비 중]";
