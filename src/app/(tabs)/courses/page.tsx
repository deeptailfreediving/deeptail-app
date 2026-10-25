import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { ChevronIcon } from "@/components/icons";
import { brand, practiceInfo } from "@/db/course-data";
import { durationLabel, listCourses, listRentalItems, listTrainingOptions, won } from "@/lib/pricing";

export const dynamic = "force-dynamic";
export const metadata = { title: "교육과정 | 딥테일 프리다이빙" };

export default async function CoursesPage() {
  const [courses, trainings, rentals] = await Promise.all([
    listCourses(),
    listTrainingOptions(),
    listRentalItems(),
  ]);

  return (
    <>
      <PageHeader title="교육과정" />
      <div className="flex flex-col gap-6 p-4">
        {/* 소개 */}
        <section className="flex flex-col gap-2 rounded-[20px] bg-brand-gradient p-5 text-white">
          <p className="text-lg font-bold">{brand.slogan}</p>
          <p className="text-[13px] leading-relaxed text-brand-soft">{brand.intro}</p>
          <p className="text-xs font-bold tracking-wide text-white/90">{brand.keywords}</p>
        </section>

        {/* 정규과정 */}
        <section className="flex flex-col gap-3">
          <h2 className="mx-1 text-base font-bold">정규과정</h2>
          <ul className="flex flex-col gap-3">
            {courses.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/courses/${c.code}`}
                  className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card"
                >
                  <span className="flex flex-1 flex-col gap-1">
                    <span className="flex items-baseline gap-2">
                      <span className="text-base font-bold">{c.name}</span>
                      <span className="text-xs font-medium text-brand">
                        {[c.levelLabel, durationLabel(c.sessionCount)].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className="text-[15px] font-bold text-brand-mid">
                      {c.price != null ? won(c.price) : "[교육비]"}
                      {c.rentalFee != null && (
                        <span className="ml-1.5 text-xs font-medium text-ink-mute">
                          장비대여료 {won(c.rentalFee)} 별도
                        </span>
                      )}
                    </span>
                    {c.benefits.length > 0 && (
                      <span className="text-xs text-ink-sub">{c.benefits[0]}</span>
                    )}
                  </span>
                  <ChevronIcon className="h-5 w-5 shrink-0 text-ink-mute" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* 자율연습반 · 정기트레이닝 */}
        <section className="flex flex-col gap-3">
          <h2 className="mx-1 text-base font-bold">자율 연습반 · 정기 트레이닝</h2>
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card">
            <p className="text-sm text-ink-sub">{practiceInfo.intro}</p>
            <div className="grid grid-cols-2 gap-2.5">
              {[practiceInfo.selfPractice, practiceInfo.regularTraining].map((p) => (
                <div key={p.name} className="flex flex-col gap-2 rounded-xl bg-canvas p-3">
                  <span className="text-sm font-bold">{p.name}</span>
                  <span className="self-start rounded bg-brand px-1.5 py-0.5 text-[11px] font-bold text-white">
                    {p.badge}
                  </span>
                  <span className="text-xs leading-relaxed text-ink-sub">{p.desc}</span>
                </div>
              ))}
            </div>
            <dl className="flex flex-col gap-1.5 border-t border-line pt-3 text-[13px]">
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 font-bold text-brand">참여 대상</dt>
                <dd>{practiceInfo.target}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-16 shrink-0 font-bold text-brand">참여 비용</dt>
                <dd>{practiceInfo.cost}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* 유료트레이닝 */}
        <section className="flex flex-col gap-3">
          <div className="mx-1 flex items-baseline justify-between">
            <h2 className="text-base font-bold">유료트레이닝</h2>
            <span className="text-xs text-ink-mute">1인 요금 · 장비대여 별도</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {trainings.map((t) => (
              <div key={t.id} className="flex flex-col gap-1 rounded-2xl bg-white p-4 shadow-card">
                <span className="text-xs font-medium text-ink-sub">
                  1:{t.participants} · {t.venue}
                </span>
                <span className="text-lg font-bold text-brand">{won(t.price)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 장비대여료 */}
        <section className="flex flex-col gap-3">
          <div className="mx-1 flex items-baseline justify-between">
            <h2 className="text-base font-bold">장비대여료</h2>
            <span className="text-xs text-ink-mute">유료트레이닝 · 자율연습 시</span>
          </div>
          <ul className="divide-y divide-line rounded-2xl bg-white px-4 shadow-card">
            {rentals.map((r) => (
              <li key={r.id} className="flex min-h-12 items-center justify-between text-sm">
                <span>{r.name}</span>
                <span className={r.payOnSite ? "text-ink-mute" : "font-bold"}>
                  {r.payOnSite || r.price == null ? "현장결제" : won(r.price)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
