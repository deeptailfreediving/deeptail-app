import { getSession } from "@/lib/auth";
import { categoryLabel, formatDate, listNotices } from "@/lib/notices";
import { deleteNotice } from "../actions";
import { ActionButton, Empty, Flash, Section } from "../ui";
import NoticeForm from "./NoticeForm";

export default async function AdminNotices({ searchParams }: { searchParams: { msg?: string } }) {
  const session = (await getSession())!;
  const isAdmin = session.user.role === "ADMIN";
  const notices = await listNotices();

  return (
    <>
      <Flash msg={searchParams.msg} />
      {isAdmin && (
        <Section title="공지 등록">
          <NoticeForm />
        </Section>
      )}
      <Section title="등록된 공지" count={notices.length}>
        {notices.length === 0 ? (
          <Empty>등록된 공지가 없어요.</Empty>
        ) : (
          <ul className="flex flex-col gap-2">
            {notices.map((n) => (
              <li key={n.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-card">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[11px] font-bold text-brand">
                    {categoryLabel[n.category]}
                    {n.pinned && " · 상단 고정"}
                  </span>
                  <span className="truncate text-sm font-bold">{n.title}</span>
                  <span className="text-xs text-ink-mute">{formatDate(n.publishedAt)}</span>
                </div>
                {isAdmin && (
                  <ActionButton action={deleteNotice.bind(null, n.id)} tone="danger">
                    삭제
                  </ActionButton>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
