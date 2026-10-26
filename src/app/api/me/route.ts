import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, tables } from "@/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** 홈 화면용 로그인 정보 (홈 화면 자체는 미리 만들어 둔 화면이라 빠르게 열림) */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null }, { headers: { "Cache-Control": "no-store" } });
  const rows = await db
    .select({ total: tables.enrollments.totalSessions, used: tables.enrollments.usedSessions })
    .from(tables.enrollments)
    .where(eq(tables.enrollments.studentId, session.user.id));
  const remaining = rows.reduce((sum, r) => sum + (r.total - r.used), 0);
  const [u] = await db
    .select({ level: tables.users.licenseLevel })
    .from(tables.users)
    .where(eq(tables.users.id, session.user.id));
  return NextResponse.json(
    { user: { name: session.user.name, remaining, level: u?.level ?? null } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
