import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { MonthlyBars, TrendLine } from "@/components/LogCharts";
import { getSession } from "@/lib/auth";
import { DISCIPLINES, fmtRecord, listMyLogs, purposeLabel, recordOf, summarize } from "@/lib/logbook";
import { md, todayYmd, weekday } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "로그북 | 딥테일 프리다이빙" };

export default async function LogbookPage({ searchParams }: { searchParams: { saved?: string } }) {
  const session = (await getSession())!;
  const logs = await listMyLogs(session.user.id);
  const sum = summarize(logs, todayYmd());

  return (
    <>
      <PageHeader title="내 로그북" back="/my" />
      <div className="flex flex-col gap-4 p-4 pb-32">
        {searchParams.saved && (
          <p role="status" className="rounded-xl bg-brand-tint px-4 py-3 text-sm font-medium text-brand-mid">
            로그를 저장했어요. 강사가 확인하면 피드백이 달려요.
          </p>
        )}

        <Link href="/my/videos" className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-card">
          <span className="flex flex-col gap-0.5">
            <span className="text-base font-bold">강습영상 · 강사 피드백</span>
            <span className="text-xs text-ink-sub">수업 영상과 피드백을 날짜별로 볼 수 있어요</span>
          </span>
          <span className="text-sm font-bold text-brand">보기</span>
        </Link>

        {/* 요약 */}
        <section className="flex flex-col gap-3 rounded-[20px] bg-brand-gradient p-5 text-white">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-brand-soft">총 다이빙</span>
            <span className="text-2xl font-extrabold">{sum.total}회</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {DISCIPLINES.map((dc) => {
              const b = sum.best[dc.key];
              return (
                <div key={dc.key} className="flex flex-col items-center gap-0.5 rounded-xl bg-white/10 px-1 py-2">
                  <span className="text-[11px] font-bold text-brand-soft">{dc.code}</span>
                  <span className="text-center text-sm font-extrabold leading-tight">
                    {b ? fmtRecord(dc.key, b.v) : "-"}
                  </span>
                </div>
              );
            })}
          </div>
          <span className="text-[11px] text-brand-soft">종목별 개인 최고 기록</span>
        </section>

        {logs.length > 0 && (
          <>
            <section className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-card">
              <h2 className="text-sm font-bold">월별 다이빙 횟수</h2>
              <MonthlyBars months={sum.months} />
            </section>

            <section className="flex flex-col gap-1 rounded-2xl bg-white p-4 shadow-card">
              <h2 className="text-sm font-bold">기록 추이</h2>
              {DISCIPLINES.filter((dc) => sum.trend[dc.key].length > 0).map((dc) => (
                <div key={dc.key} className="border-t border-line pt-2 first-of-type:border-0">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-bold text-ink-sub">
                      {dc.code} {dc.name}
                    </span>
                    <span className="text-ink-mute">최근 {sum.trend[dc.key].length}회</span>
                  </div>
                  <TrendLine
                    points={sum.trend[dc.key]}
                    label={`${dc.code} ${dc.name}`}
                    format={(v) => fmtRecord(dc.key, v)}
                  />
                </div>
              ))}
            </section>
          </>
        )}

        {/* 목록 */}
        <section className="flex flex-col gap-2">
          <h2 className="mx-1 text-base font-bold">다이빙 기록</h2>
          {logs.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-center text-sm leading-relaxed text-ink-sub shadow-card">
              아직 기록이 없어요.
              <br />
              오늘 다이빙을 기록하고 강사 피드백을 받아 보세요.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {logs.map((l) => {
                const recs = DISCIPLINES.map((dc) => ({ dc, v: recordOf(l, dc.key) })).filter((r) => r.v != null);
                return (
                  <li key={l.id}>
                    <Link href={`/my/logbook/${l.id}`} className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-card">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[15px] font-bold">
                          {md(l.diveDate)} ({weekday(l.diveDate)})
                        </span>
                        {l.reviewed ? (
                          <span className="rounded-full bg-brand-tint px-2.5 py-0.5 text-[11px] font-bold text-brand-mid">
                            {l.feedback ? "피드백 있음" : "확인완료"}
                          </span>
                        ) : (
                          <span className="rounded-full bg-canvas px-2.5 py-0.5 text-[11px] font-medium text-ink-mute">
                            확인 전
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-ink-sub">
                        {purposeLabel[l.purpose]} · {l.place}
                        {l.suit && ` · ${l.suit}`}
                        {l.weight && l.weight !== "-" && ` · ${l.weight}`}
                      </span>
                      {recs.length > 0 && (
                        <span className="flex flex-wrap gap-1.5">
                          {recs.map(({ dc, v }) => (
                            <span key={dc.key} className="rounded-md bg-canvas px-2 py-1 text-xs">
                              <b className="text-brand">{dc.code}</b> {fmtRecord(dc.key, v!)}
                            </span>
                          ))}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(58px+max(env(safe-area-inset-bottom),12px))] z-10 mx-auto max-w-[480px] px-4 pb-3">
        <Link
          href="/my/logbook/new"
          className="flex h-14 items-center justify-center rounded-xl bg-brand text-base font-bold text-white shadow-card"
        >
          + 오늘 다이빙 기록하기
        </Link>
      </div>
    </>
  );
}
