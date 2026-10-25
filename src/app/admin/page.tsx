import { getSession } from "@/lib/auth";
import { listRequestsForAdmin } from "@/lib/requests";
import { approveRequest, cancelRequest, completeRequest, markPaid, rejectRequest } from "./actions";
import { ActionButton, Empty, Flash, RequestCard, Section } from "./ui";

export default async function AdminHome({ searchParams }: { searchParams: { msg?: string } }) {
  const session = (await getSession())!;
  const isAdmin = session.user.role === "ADMIN";
  const [pending, unpaid, upcoming] = await Promise.all([
    listRequestsForAdmin("pending"),
    listRequestsForAdmin("unpaid"),
    listRequestsForAdmin("upcoming"),
  ]);

  return (
    <>
      <Flash msg={searchParams.msg} />

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
