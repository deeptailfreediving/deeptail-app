import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { categoryLabel, formatDate, listNotices } from "@/lib/notices";

export const dynamic = "force-dynamic";
export const metadata = { title: "공지사항 | 딥테일 프리다이빙" };

export default async function NoticesPage() {
  const notices = await listNotices();
  return (
    <>
      <PageHeader title="딥테일 공지사항" back="/" />
      <ul className="m-4 divide-y divide-line rounded-2xl bg-white shadow-card">
        {notices.map((n) => (
          <li key={n.id}>
            <Link href={`/notices/${n.id}`} className="flex flex-col gap-1 p-4">
              <span className="text-[11px] font-bold text-brand">{categoryLabel[n.category]}</span>
              <span className="text-[15px] font-bold">{n.title}</span>
              <span className="text-xs text-ink-mute">{formatDate(n.publishedAt)}</span>
            </Link>
          </li>
        ))}
        {notices.length === 0 && <li className="p-6 text-center text-sm text-ink-mute">등록된 공지가 없어요.</li>}
      </ul>
    </>
  );
}
