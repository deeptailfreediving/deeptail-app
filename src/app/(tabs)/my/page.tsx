import Link from "next/link";
import { getSession } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { listMyRequests, paymentLabel } from "@/lib/requests";
import { listMyEnrollments } from "@/lib/schedule";
import { hm, longDate } from "@/lib/time";
import LogoutButton from "./LogoutButton";
import PushToggle from "@/components/PushToggle";

export const dynamic = "force-dynamic";
export const metadata = { title: "마이페이지 | 딥테일 프리다이빙" };

const roleLabel = { STUDENT: "교육생", INSTRUCTOR: "강사", ADMIN: "대표" } as const;

export default async function MyPage() {
  // 미들웨어가 로그인을 보장함
  const session = (await getSession())!;
  const [requests, enrollments] = await Promise.all([
    listMyRequests(session.user.id),
    listMyEnrollments(session.user.id),
  ]);

  return (
    <>
      <PageHeader title="마이페이지" />
      <section className="m-4 flex items-center justify-between rounded-2xl bg-white p-5 shadow-card">
        <div className="flex flex-col gap-1">
          <span className="text-lg font-bold">{session.user.name}님</span>
          <span className="text-sm text-ink-sub">
            {roleLabel[session.user.role]} · {session.user.email}
          </span>
        </div>
        <LogoutButton />
      </section>

      <PushToggle />

      {session.user.role !== "STUDENT" && (
        <Link
          href="/admin"
          className="mx-4 mb-4 flex min-h-12 items-center justify-center rounded-xl bg-brand-deep text-sm font-bold text-white"
        >
          관리자 화면 열기
        </Link>
      )}

      {enrollments.length > 0 && (
        <section className="mx-4 mb-4 flex flex-col gap-2">
          <h2 className="mx-1 text-base font-bold">수강 현황</h2>
          {enrollments.map((e) => (
            <div key={e.id} className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-card">
              <div className="flex justify-between text-sm">
                <b>{e.course.name}</b>
                <span className="text-ink-sub">
                  {e.usedSessions} / {e.totalSessions}회 완료
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-canvas" aria-hidden>
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${(e.usedSessions / Math.max(e.totalSessions, 1)) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="mx-4 mb-4 flex flex-col gap-2">
        <h2 className="mx-1 text-base font-bold">내 신청</h2>
        {requests.length === 0 ? (
          <p className="rounded-2xl bg-white p-5 text-center text-sm text-ink-mute shadow-card">아직 신청한 일정이 없어요.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {requests.map((r) => (
              <li key={r.id}>
                <Link href={`/my/requests/${r.id}`} className="flex flex-col gap-1.5 rounded-2xl bg-white p-4 shadow-card">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold">{r.title}</span>
                    <StatusBadge status={r.status} />
                  </span>
                  <span className="text-xs text-ink-sub">
                    {r.startsAt ? `${longDate(r.startsAt)} ${hm(r.startsAt)}` : ""} · {r.location ?? "장소 미정"} ·{" "}
                    {paymentLabel[r.paymentStatus]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link
        href="/my/logbook"
        className="mx-4 mb-6 flex items-center justify-between rounded-2xl bg-white p-4 shadow-card"
      >
        <span className="flex flex-col gap-0.5">
          <span className="text-base font-bold">내 로그북</span>
          <span className="text-xs text-ink-sub">다이빙 기록 · 개인 최고 기록 · 강습영상 · 강사 피드백</span>
        </span>
        <span className="text-sm font-bold text-brand">열기</span>
      </Link>
    </>
  );
}
