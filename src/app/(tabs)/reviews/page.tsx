import PageHeader from "@/components/PageHeader";
import { CAFE_URL, listPublicReviews, syncIfStale } from "@/lib/reviews";
import ReviewList from "./ReviewList";

export const metadata = { title: "강습 · 투어 후기 | 딥테일 프리다이빙" };
// 미리 만들어 두고 1시간마다 새로 만듦 (그때 6시간 넘었으면 네이버 카페에서 새 후기를 가져옴)
export const revalidate = 3600;

export default async function ReviewsPage() {
  await syncIfStale().catch(() => undefined);
  const items = await listPublicReviews();

  return (
    <>
      <PageHeader title="강습 · 투어 후기" back="/" />
      <ReviewList items={items} />
      <a
        href={CAFE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mx-4 mb-6 flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-brand bg-white text-sm font-bold text-brand"
      >
        네이버 카페에서 후기 더 보기 ↗
      </a>
    </>
  );
}
