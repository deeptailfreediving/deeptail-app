import { requireStaff } from "@/lib/staff";
import { CAFE_URL, REVIEW_BOARD, categoryLabel, lastSync, listAllReviews, reviewsEnabled } from "@/lib/reviews";
import {
  addReviewManually,
  clearReviewImage,
  setReviewImage,
  syncReviewsNow,
  toggleReviewCategory,
  toggleReviewHidden,
  toggleReviewPinned,
} from "../actions";
import { ActionButton, Empty, Flash, Section } from "../ui";
import ImagePicker from "@/components/ImagePicker";

export const dynamic = "force-dynamic";

const fmt = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

const small = "min-h-9 rounded-lg border border-line px-3 text-xs font-bold";

export default async function AdminReviews({ searchParams }: { searchParams: { msg?: string } }) {
  await requireStaff();
  const [items, sync] = await Promise.all([listAllReviews(), lastSync()]);
  const enabled = reviewsEnabled();
  const shown = items.filter((r) => !r.hidden).length;

  return (
    <>
      <Flash msg={searchParams.msg} />

      <Section title="네이버 카페 연동">
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-4 text-sm shadow-card">
          <p>
            <a href={CAFE_URL} target="_blank" rel="noopener noreferrer" className="font-bold text-brand">
              딥테일 카페
            </a>{" "}
            글 중 제목·요약에 &lsquo;후기&rsquo;가 들어간 글을 6시간마다 자동으로 가져와요.
          </p>
          <p className="text-xs text-ink-sub">
            네이버 검색은 게시판 이름(&lsquo;{REVIEW_BOARD}&rsquo;)으로 거를 수 없어서, 다른 게시판 글이 섞이면 아래에서 숨겨 주세요.
            검색에 늦게 잡히는 글은 직접 추가할 수 있어요.
          </p>
          <p className="text-xs">
            {!enabled ? (
              <b className="text-amber-800">Vercel 환경변수 NAVER_API_KEY_ID, NAVER_API_KEY 를 넣어 주세요.</b>
            ) : sync ? (
              <span className={sync.ok ? "text-ink-sub" : "font-bold text-red-700"}>
                마지막 가져오기 {fmt(sync.at)} · {sync.ok ? `찾은 후기 ${sync.found}건, 새로 추가 ${sync.added}건` : `실패: ${sync.error}`}
              </span>
            ) : (
              <span className="text-ink-sub">아직 가져온 적이 없어요.</span>
            )}
          </p>
          {enabled && (
            <div>
              <ActionButton action={syncReviewsNow}>지금 가져오기</ActionButton>
            </div>
          )}
        </div>
      </Section>

      <Section title="직접 추가">
        <form action={addReviewManually} className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-card">
          <input name="url" required placeholder="카페 글 주소 (https://cafe.naver.com/deeptailfreediving/123)" className="min-h-11 rounded-xl border border-line px-3 text-sm" />
          <input name="title" required placeholder="제목" className="min-h-11 rounded-xl border border-line px-3 text-sm" />
          <textarea name="excerpt" rows={2} placeholder="요약 (선택)" className="rounded-xl border border-line px-3 py-2 text-sm" />
          <div className="flex items-center gap-2">
            <select name="category" defaultValue="" className="min-h-11 flex-1 rounded-xl border border-line px-3 text-sm">
              <option value="">분류 자동</option>
              <option value="LESSON">강습후기</option>
              <option value="TOUR">투어후기</option>
            </select>
            <button type="submit" className="min-h-11 rounded-xl bg-brand px-4 text-sm font-bold text-white">
              추가
            </button>
          </div>
        </form>
      </Section>

      <Section title={`후기 목록 (공개 ${shown} / 전체 ${items.length})`}>
        {items.length === 0 ? (
          <Empty>아직 후기가 없어요.</Empty>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((r) => (
              <li key={r.id} className={`flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-card ${r.hidden ? "opacity-60" : ""}`}>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                  <span className={`rounded-md px-2 py-0.5 ${r.category === "TOUR" ? "bg-brand-deep text-white" : "bg-brand-tint text-brand-mid"}`}>
                    {categoryLabel[r.category]}
                  </span>
                  {r.pinned && <span className="rounded-md bg-amber-100 px-2 py-0.5 text-amber-900">추천</span>}
                  {r.hidden && <span className="rounded-md bg-canvas px-2 py-0.5 text-ink-mute">숨김</span>}
                  {r.source === "MANUAL" && <span className="text-ink-mute">직접 추가</span>}
                </div>
                <div className="flex items-start gap-3">
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm font-bold">
                    {r.title} <span className="text-brand">↗</span>
                  </a>
                  {r.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.imageUrl} alt="" referrerPolicy="no-referrer" className="h-14 w-14 shrink-0 rounded-lg bg-canvas object-cover" />
                  )}
                </div>
                {r.excerpt && <p className="line-clamp-2 text-xs text-ink-sub">{r.excerpt}</p>}
                <div className="flex flex-wrap gap-1.5">
                  <form action={toggleReviewHidden.bind(null, r.id)}>
                    <button className={small}>{r.hidden ? "공개하기" : "숨기기"}</button>
                  </form>
                  <form action={toggleReviewCategory.bind(null, r.id)}>
                    <button className={small}>{r.category === "TOUR" ? "강습후기로" : "투어후기로"}</button>
                  </form>
                  <form action={toggleReviewPinned.bind(null, r.id)}>
                    <button className={small}>{r.pinned ? "추천 해제" : "추천(맨 위)"}</button>
                  </form>
                  {r.imageUrl && (
                    <form action={clearReviewImage.bind(null, r.id)}>
                      <button className={small}>사진 빼기</button>
                    </form>
                  )}
                </div>
                <details>
                  <summary className="cursor-pointer text-xs font-bold text-brand">미리보기 사진 {r.imageUrl ? "바꾸기" : "올리기"}</summary>
                  <form action={setReviewImage.bind(null, r.id)} className="mt-2 flex flex-col gap-2">
                    <ImagePicker name="image" label="사진" maxSize={600} hint="카페 글의 사진을 저장해서 올려 주세요. 작게 줄여서 저장돼요." />
                    <button className="min-h-10 rounded-xl bg-brand text-sm font-bold text-white">저장</button>
                  </form>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
