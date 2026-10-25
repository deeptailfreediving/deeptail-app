import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { categoryLabel, formatDate, getNotice } from "@/lib/notices";

export const dynamic = "force-dynamic";

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
