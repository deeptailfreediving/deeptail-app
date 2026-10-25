import Link from "next/link";
import { notFound } from "next/navigation";
import { db, tables } from "@/db";
import PageHeader, { ComingSoon } from "@/components/PageHeader";
import { durationLabel, getCourseByCode, won } from "@/lib/pricing";

// 자주 바뀌지 않는 화면 — 미리 만들어 두고 5분마다 갱신 (관리자 수정 시 즉시 갱신)
export const revalidate = 300;

// 빌드할 때 과정 상세를 미리 만들어 둠
export async function generateStaticParams() {
  const rows = await db.select({ code: tables.courses.code }).from(tables.courses);
  return rows.map((r) => ({ code: r.code }));
}

export async function generateMetadata({ params }: { params: { code: string } }) {
  const c = await getCourseByCode(params.code);
  return { title: c ? `${c.name} | 딥테일 프리다이빙` : "교육과정" };
}

export default async function CourseDetail({ params }: { params: { code: string } }) {
  const c = await getCourseByCode(params.code);
  if (!c) notFound();

  const hasGuide = c.sessions.length > 0;

  return (
    <>
      <PageHeader title={c.name} back="/courses" />
      <div className="flex flex-col gap-4 p-4 pb-28">
        {/* 제목 */}
        <section className="flex flex-col gap-2 rounded-[20px] bg-brand-gradient p-5 text-white">
          <span className="text-xs font-bold tracking-wide text-brand-soft">
            {[c.levelLabel, durationLabel(c.sessionCount)].filter(Boolean).join(" / ")}
          </span>
          <h2 className="text-2xl font-extrabold">{c.name}</h2>
          {c.summary && <p className="text-sm text-brand-soft">{c.summary}</p>}
        </section>

        {/* 혜택 */}
        {c.benefits.length > 0 && (
          <ul className="grid grid-cols-3 gap-2">
            {c.benefits.map((b) => (
              <li
                key={b}
                className="flex items-center rounded-xl bg-brand-tint p-3 text-[12px] font-bold leading-snug text-brand-mid"
              >
                {b}
              </li>
            ))}
          </ul>
        )}

        {!hasGuide && <ComingSoon>과정 구성은 준비 중이에요. 딥테일로 문의해 주세요.</ComingSoon>}

        {/* 회차 구성 */}
        {hasGuide && (
          <section className="flex flex-col rounded-2xl bg-white px-4 shadow-card">
            <h3 className="pt-4 text-sm font-bold text-brand">구성</h3>
            <ol className="divide-y divide-line">
              {c.sessions.map((s) => (
                <li key={s.id} className="flex gap-4 py-3.5">
                  {c.sessions.length > 1 && (
                    <span className="w-11 shrink-0 text-sm font-extrabold text-brand">{s.seq}회차</span>
                  )}
                  <span className="flex flex-col gap-0.5 text-sm">
                    {s.items.map((it) => (
                      <span key={it}>{it}</span>
                    ))}
                    {s.detail && <span className="text-xs text-ink-sub">{s.detail}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* 목표 · 대상 */}
        {(c.goals.length > 0 || c.audience.length > 0) && (
          <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card text-sm">
            {c.goals.length > 0 && (
              <div className="flex gap-4">
                <h3 className="w-16 shrink-0 font-bold text-brand">교육 목표</h3>
                <ul className="flex flex-col gap-0.5">
                  {c.goals.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              </div>
            )}
            {c.audience.length > 0 && (
              <div className="flex gap-4 border-t border-line pt-3">
                <h3 className="w-16 shrink-0 font-bold text-brand">추천 대상</h3>
                <ul className="flex flex-col gap-0.5">
                  {c.audience.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* 교육 비용 */}
        <section className="flex flex-col gap-1.5 rounded-2xl bg-white p-4 shadow-card">
          <h3 className="text-sm font-bold text-brand">교육 비용</h3>
          <p className="text-[28px] font-extrabold text-brand-mid">
            {c.price != null ? won(c.price) : "[교육비]"}
          </p>
          {c.rentalFee != null && (
            <p className="text-sm text-ink-sub">
              장비대여료 {won(c.rentalFee)} 별도
              {c.rentalItemsNote && <span className="block text-xs">대여 품목: {c.rentalItemsNote}</span>}
            </p>
          )}
          {c.companionDiscount != null && (
            <p className="text-sm font-bold text-ink">동반 등록 시 {won(c.companionDiscount)} 할인</p>
          )}
          {c.validityMonths != null && (
            <p className="mt-1 border-t border-line pt-2 text-[13px] text-ink-sub">
              교육 유효기간 · {c.validityMonths === 12 ? "1년" : `${c.validityMonths}개월`} 이내에 수료 시 자격 발급
            </p>
          )}
        </section>

        {c.upgradeNote && (
          <section className="flex flex-col gap-1.5 rounded-2xl border border-brand/40 bg-white p-4 text-sm">
            <h3 className="font-bold text-brand">연계 혜택</h3>
            <p className="leading-relaxed">{c.upgradeNote}</p>
          </section>
        )}

        {c.practiceFromSession != null && (
          <section className="rounded-2xl bg-brand-tint p-4 text-sm text-brand-mid">
            <b>{c.practiceFromSession}회차 강습 이후</b> 자율 연습반(상시)과 정기 트레이닝(주 1회)에 추가 비용
            없이 참여할 수 있어요. 개인 장비대여료만 발생해요.
          </section>
        )}
      </div>

      {/* 신청 버튼 */}
      <div className="fixed inset-x-0 bottom-[calc(58px+max(env(safe-area-inset-bottom),12px))] z-10 mx-auto max-w-[480px] px-4 pb-3">
        <Link
          href="/schedule"
          className="flex h-13 min-h-12 items-center justify-center rounded-xl bg-brand text-base font-bold text-white shadow-card"
        >
          일정 보고 신청하기
        </Link>
      </div>
    </>
  );
}
