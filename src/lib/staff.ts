import { redirect } from "next/navigation";
import { getSession } from "./auth";

/** 강사 · 대표만 통과. 아니면 홈으로 */
export async function requireStaff() {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN" && session.user.role !== "INSTRUCTOR") redirect("/");
  return session;
}

/** 대표만 통과 (입금 확인, 일정·공지 삭제) */
export async function requireAdmin() {
  const session = await requireStaff();
  if (session.user.role !== "ADMIN") redirect("/admin?msg=" + encodeURIComponent("대표만 할 수 있는 작업이에요."));
  return session;
}
