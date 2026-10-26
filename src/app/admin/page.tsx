import { getSession } from "@/lib/auth";
import { listRequestsForAdmin } from "@/lib/requests";
import { approveLicense, approveRequest, cancelRequest, completeRequest, markPaid, rejectLicense, rejectRequest } from "./actions";
import { listPendingLicenseRequests } from "@/lib/license";
import { uploadUrl } from "@/lib/uploads";
import LevelBadge from "@/components/LevelBadge";
import { ActionButton, Empty, Flash, RequestCard, Section } from "./ui";

export default async function AdminHome({ searchParams }: { searchParams: { msg?: string } }) {
  const session = (await getSession())!;
  const isAdmin = session.user.role === "ADMIN";
  const [licenses, pending, unpaid, upcoming] = await Promise.all([
    listPendingLicenseRequests(),
    listRequestsForAdmin("pending"),
    listRequestsForAdmin("unpaid"),
    listRequestsForAdmin("upcoming"),
  ]);

  return (
    <>
      <Flash msg={searchParams.msg} />

      {licenses.length > 0 && (
        <Section title="자격 승인 요청" count={licenses.length}>
          <ul className="flex flex-col gap-2">
            {licenses.map((l) => (
              <li key={l.id} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card">
                <div className="flex items-start gap-3">
                  {l.imageId ? (
                    <a href={uploadUrl(l.imageId)} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={uploadUrl(l.imageId)} alt="자격증 사진" className="h-20 w-20 rounded-xl border border-line object-cover" />
                    </a>
                  ) : (
                    <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-canvas text-xs text-ink-mute">사진 없음</span>
                  )}
                  <div className="flex min-w-0 flex-col gap-0.5 text-sm">
                    <b>
                      {l.name}
                      <LevelBadge level={l.currentLevel} />
                    </b>
                    <span className="text-ink-sub">
                      요청: <b className="text-brand">{l.agency} 레벨 {l.level}</b>
                    </span>
                    <a href={`tel:${l.phone}`} className="text-xs text-brand">
                      {l.phone}
                    </a>
                    <span className="text-xs text-ink-mute">사진을 누르면 크게 볼 수 있어요</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ActionButton action={approveLicense.bind(null, l.id)}>레벨 {l.level} 승인</ActionButton>
                  <form action={rejectLicense.bind(null, l.id)} className="flex w-full gap-2">
                    <input name="note" placeholder="반려 사유 (선택)" className="min-h-11 min-w-0 flex-1 rounded-xl border border-line px-3 text-sm" />
                    <button className="min-h-11 shrink-0 rounded-xl border border-red-200 px-3 text-sm font-bold text-red-700">반려</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="승인 대기" count={pending.length}>
        {pending.length === 0 ? (
          <Empty>승인할 신청이 없어요.</Empty>
        ) : (
          <ul className="flex flex-col gap-2">
            {pending.map((req) => (
              <RequestCard key={req.id} req={req}>
                <ActionButton action={approveRequest.bind(null, req.id)}>승인</ActionButton>
                <ActionButton action={rejectRequest.bind(null, req.id)} tone="danger">
                  반려
                </ActionButton>
              </RequestCard>
            ))}
          </ul>
        )}
      </Section>

      <Section title="입금 확인" count={unpaid.length}>
        {unpaid.length === 0 ? (
          <Empty>입금을 기다리는 신청이 없어요.</Empty>
        ) : (
          <ul className="flex flex-col gap-2">
            {unpaid.map((req) => (
              <RequestCard key={req.id} req={req}>
                {isAdmin ? (
                  <ActionButton action={markPaid.bind(null, req.id)}>입금 확인</ActionButton>
                ) : (
                  <span className="text-xs text-ink-mute">입금 확인은 대표만 할 수 있어요.</span>
                )}
              </RequestCard>
            ))}
          </ul>
        )}
      </Section>

      <Section title="확정된 일정" count={upcoming.length}>
        {upcoming.length === 0 ? (
          <Empty>확정된 일정이 없어요.</Empty>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((req) => (
              <RequestCard key={req.id} req={req}>
                <ActionButton action={completeRequest.bind(null, req.id)}>
                  {req.kind === "REGULAR_CLASS" ? "수업 완료 (1회 차감)" : "참여 완료"}
                </ActionButton>
                <ActionButton action={cancelRequest.bind(null, req.id)} tone="quiet">
                  취소
                </ActionButton>
              </RequestCard>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
