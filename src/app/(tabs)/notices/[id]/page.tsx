import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { categoryLabel, formatDate, getNotice } from "@/lib/notices";

// 자주 바뀌지 않는 화면 — 미리 만들어 두고 5분마다 갱신 (관리자 수정 시 즉시 갱신)
export const revalidate = 300;

// 처음 열 때 만들어 두고 이후엔 바로 보여줌
export function generateStaticParams() {
  return [];
}

export default async function NoticeDetail({ params }: { params: { id: string } }) {
  const n = await getNotice(params.id);
  if (!n) notFound();
  return (
    <>
      <PageHeader title="공지사항" back="/notices" />
      <article className="m-4 flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-card">
        <span className="self-start rounded-md bg-brand px-2 py-0.5 text-[11px] font-bold text-white">
          {categoryLabel[n.category]}
        </span>
        <h2 className="text-xl font-bold">{n.title}</h2>
        <p className="text-xs text-ink-mute">{formatDate(n.publishedAt)}</p>
        {n.summary && <p className="font-medium text-brand-mid">{n.summary}</p>}
        <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink">{n.body}</p>
      </article>
    </>
  );
}
