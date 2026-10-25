import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { getSession } from "@/lib/auth";
import { bankAccount } from "@/lib/business";
import { won } from "@/lib/pricing";
import { getMyRequest, paymentLabel } from "@/lib/requests";
import { hm, longDate } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "신청 내역 | 딥테일 프리다이빙" };

export default async function RequestDetail({ params }: { params: { id: string } }) {
  const session = (await getSession())!;
  const req = await getMyRequest(params.id, session.user.id);
  if (!req) notFound();

  const rentals = [
    req.rentMaskSnorkel && "마스크 · 스노클",
    req.rentLongFin && "롱핀",
    req.rentWeight && "웨이트",
    req.rentSuit && "슈트 (현장결제)",
  ].filter(Boolean);

  const headline =
    req.status === "PENDING"
      ? "신청이 접수됐어요"
      : req.status === "APPROVED"
        ? "신청이 확정됐어요"
        : "신청 내역";

  return (
    <>
      <PageHeader title="신청 내역" back="/my" />
      <div className="flex flex-col gap-4 p-4">
        <section className="flex flex-col items-center gap-2 rounded-[20px] bg-brand-gradient p-6 text-center text-white">
          <p className="text-xl font-bold">{headline}</p>
          <p className="text-sm text-brand-soft">
            {req.status === "PENDING" && "담당강사가 확인 후 확정해 드려요."}
            {req.status === "APPROVED" && "일정에 맞춰 와 주세요."}
          </p>
          <div className="flex gap-2">
            <StatusBadge status={req.status} />
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{paymentLabel[req.paymentStatus]}</span>
          </div>
        </section>

        <section className="flex flex-col gap-2 rounded-2xl bg-white p-4 text-sm shadow-card">
          <p className="text-[15px] font-bold">{req.title}</p>
          {req.startsAt && req.endsAt && (
            <p className="text-ink-sub">
              {longDate(req.startsAt)} {hm(req.startsAt)} ~ {hm(req.endsAt)}
            </p>
          )}
          <p className="text-ink-sub">{req.location ?? "장소 미정"}</p>
          {rentals.length > 0 && (
            <p className="border-t border-line pt-2 text-ink-sub">
              장비대여 · {rentals.join(", ")}
              {req.finSize && ` · 발 ${req.finSize}mm`}
              {req.weightKg && ` · ${req.weightKg}kg`}
            </p>
          )}
          {req.memo && <p className="border-t border-line pt-2 text-ink-sub">요청 사항 · {req.memo}</p>}
        </section>

        {req.total > 0 && (
          <section className="flex flex-col gap-2 rounded-2xl bg-white p-4 text-sm shadow-card">
            <div className="flex justify-between">
              <span className="text-ink-sub">교육비 · 참가비</span>
              <b>{won(req.fee ?? 0)}</b>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-sub">장비대여료</span>
              <b>{won(req.rentalFee ?? 0)}</b>
            </div>
            <div className="flex items-center justify-between border-t border-line pt-2">
              <span className="font-bold">입금하실 금액</span>
              <span className="text-xl font-extrabold text-brand-mid">{won(req.total)}</span>
            </div>
            {req.paymentStatus === "UNPAID" && (
              <p className="rounded-xl bg-canvas p-3">
                {bankAccount.bank} <b>{bankAccount.number}</b>
                <br />
                예금주 {bankAccount.holder}
              </p>
            )}
          </section>
        )}

        <Link href="/schedule" className="flex min-h-12 items-center justify-center rounded-xl border border-brand text-sm font-bold text-brand">
          일정으로 돌아가기
        </Link>
      </div>
    </>
  );
}
