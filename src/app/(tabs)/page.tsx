import Link from "next/link";
import { AccountButton, Greeting, MembersOnlyBadge } from "@/components/HomeUser";
import { categoryLabel, formatDate, listNotices } from "@/lib/notices";
import { CalendarIcon, CapIcon, ChatIcon, ChevronIcon, PhotoIcon, PlayIcon } from "@/components/icons";

// 홈은 미리 만들어 두고(공지 바뀌면 즉시 갱신) 로그인 정보만 따로 불러와서 바로 열림
export const revalidate = 300;

export default async function HomePage() {
  const notices = await listNotices(3);
  const [featured, ...rest] = notices;

  return (
    <>
      <header className="flex flex-col gap-5 bg-brand-gradient px-5 pb-14 pt-7 text-white">
        <div className="flex items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-white.webp" alt="DEEPTAIL FREEDIVING" width={139} height={40} className="h-10 w-auto" />
          <AccountButton />
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-[22px] font-bold leading-snug">오늘은 어디서 숨을 참아볼까요?</p>
          <p className="text-sm text-brand-soft">
            <Greeting />
          </p>
        </div>
      </header>

      <main className="-mt-8 flex flex-col gap-5 px-4 pb-6">
        {/* 공지사항 */}
        <section className="flex flex-col gap-3 rounded-[20px] bg-white p-[18px] shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">딥테일 공지사항</h2>
            <Link href="/notices" className="text-[13px] font-medium text-brand">
              전체 보기
            </Link>
          </div>
          {featured ? (
            <Link href={`/notices/${featured.id}`} className="flex flex-col gap-1.5 rounded-2xl bg-brand-tint p-3.5">
              <span className="self-start rounded-md bg-brand px-2 py-0.5 text-[11px] font-bold text-white">
                {categoryLabel[featured.category]}
              </span>
              <span className="text-[15px] font-bold">{featured.title}</span>
              {featured.summary && <span className="text-[13px] text-ink-sub">{featured.summary}</span>}
            </Link>
          ) : (
            <p className="py-4 text-center text-sm text-ink-mute">등록된 공지가 없어요.</p>
          )}
          {rest.map((n) => (
            <Link
              key={n.id}
              href={`/notices/${n.id}`}
              className="flex min-h-11 items-center justify-between gap-3 border-t border-line px-1"
            >
              <span className="flex min-w-0 items-center gap-2 text-sm">
                <span className="shrink-0 text-[11px] font-bold text-brand">{categoryLabel[n.category]}</span>
                <span className="truncate">{n.title}</span>
              </span>
              <span className="shrink-0 text-xs text-ink-mute">{formatDate(n.publishedAt)}</span>
            </Link>
          ))}
        </section>

        {/* 바로가기 */}
        <section className="flex flex-col gap-3">
          <h2 className="mx-1 text-base font-bold">바로가기</h2>
          <Link href="/schedule" className="flex items-center gap-3.5 rounded-[20px] bg-brand px-[18px] py-4 text-white">
            <CalendarIcon className="h-7 w-7" />
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-base font-bold">일정안내 및 예약</span>
              <span className="text-xs text-brand-soft">자율연습 · 정기트레이닝 확인, 수업 신청</span>
            </span>
            <ChevronIcon className="h-5 w-5" />
          </Link>
          <div className="grid grid-cols-2 gap-2.5">
            <Tile href="/courses" label="교육과정" Icon={CapIcon} />
            <Tile href="/gallery" label="사진 · 영상" Icon={PhotoIcon} />
            <Tile href="/reviews" label="강습 · 투어 후기" Icon={ChatIcon} />
            <Tile href="/materials" label="교육자료" Icon={PlayIcon} locked />
          </div>
        </section>
      </main>
    </>
  );
}

function Tile({
  href,
  label,
  Icon,
  locked,
}: {
  href: string;
  label: string;
  Icon: (p: { className?: string }) => JSX.Element;
  locked?: boolean;
}) {
  return (
    <Link href={href} className="flex flex-col gap-2.5 rounded-[18px] bg-white p-4 shadow-card">
      <span className="flex items-start justify-between">
        <Icon className="h-[26px] w-[26px] text-brand" />
        {locked && <MembersOnlyBadge />}
      </span>
      <span className="text-[15px] font-bold">{label}</span>
    </Link>
  );
}
