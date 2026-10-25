import { asc, eq, sql } from "drizzle-orm";
import { db, tables } from "@/db";
import { listNotionStudents, normId, notionEnabled } from "@/lib/notion";
import { pushEnabled } from "@/lib/push";
import { requireAdmin } from "@/lib/staff";
import { autoLinkByName, linkNotionStudent, seedNotionFeedback } from "../actions";
import { ActionButton, Flash, Section } from "../ui";

export const dynamic = "force-dynamic";

export default async function AdminNotion({ searchParams }: { searchParams: { msg?: string } }) {
  await requireAdmin();
  const enabled = notionEnabled();
  const [users, [token], [{ seeded }], [{ subs }]] = await Promise.all([
    db.select().from(tables.users).orderBy(asc(tables.users.name)),
    db.select().from(tables.appSettings).where(eq(tables.appSettings.key, "notion_webhook_token")),
    db.select({ seeded: sql<number>`count(*)::int` }).from(tables.notionVideoState),
    db.select({ subs: sql<number>`count(*)::int` }).from(tables.pushSubscriptions),
  ]);

  let students: { id: string; name: string }[] = [];
  let error = "";
  if (enabled) {
    try {
      students = await listNotionStudents();
    } catch (e) {
      error = (e as Error).message;
    }
  }

  const Row = ({ ok, label, detail }: { ok: boolean; label: string; detail: string }) => (
    <li className="flex items-start gap-3 py-2.5">
      <span className={`mt-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${ok ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>
        {ok ? "완료" : "필요"}
      </span>
      <span className="flex flex-col text-sm">
        <b>{label}</b>
        <span className="break-all text-xs text-ink-sub">{detail}</span>
      </span>
    </li>
  );

  return (
    <>
      <Flash msg={searchParams.msg} />
      <Section title="연동 상태">
        <ul className="divide-y divide-line rounded-2xl bg-white px-4 shadow-card">
          <Row ok={enabled && !error} label="노션 연결 키 (NOTION_TOKEN)" detail={!enabled ? "Vercel 환경변수에 넣어 주세요" : error ? `연결 오류: ${error}` : `노션 교육생 ${students.length}명 확인`} />
          <Row ok={!!token} label="노션 웹훅 확인 토큰" detail={token ? `노션 웹훅 '확인'에 붙여넣을 값: ${token.value}` : "노션에서 웹훅을 만들면 여기에 토큰이 나타나요"} />
          <Row ok={pushEnabled()} label="푸시 알림 키 (VAPID)" detail={pushEnabled() ? `알림을 켠 기기 ${subs}대` : "Vercel 환경변수에 넣어 주세요"} />
          <Row ok={seeded > 0} label="기존 피드백 정리" detail={seeded > 0 ? `${seeded}건 기록됨` : "처음 한 번 눌러 주세요 (옛 피드백으로 알림이 가지 않게)"} />
        </ul>
        {enabled && !error && (
          <div className="flex flex-wrap gap-2">
            <ActionButton action={autoLinkByName}>이름 같은 회원 자동 연결</ActionButton>
            {seeded === 0 && (
              <ActionButton action={seedNotionFeedback} tone="quiet">
                기존 피드백 정리
              </ActionButton>
            )}
          </div>
        )}
      </Section>

      {enabled && !error && (
        <Section title="회원 ↔ 노션 교육생 연결">
          <ul className="flex flex-col gap-2">
            {users.map((u) => {
              const linked = students.find((s) => u.notionStudentPageId && normId(s.id) === u.notionStudentPageId);
              const suggest = !linked ? students.find((s) => s.name.trim() === u.name.trim()) : undefined;
              return (
                <li key={u.id} className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-card">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-bold">{u.name}</span>
                    <span className="truncate text-xs text-ink-mute">{u.email}</span>
                  </div>
                  <form action={linkNotionStudent.bind(null, u.id)} className="flex gap-2">
                    <select
                      name="notionPageId"
                      defaultValue={linked ? normId(linked.id) : suggest ? normId(suggest.id) : ""}
                      aria-label={`${u.name} 노션 교육생`}
                      className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-white px-3 text-sm"
                    >
                      <option value="">연결 안 함</option>
                      {students.map((s) => (
                        <option key={s.id} value={normId(s.id)}>
                          {s.name || "(이름 없음)"}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="min-h-11 shrink-0 rounded-xl bg-brand px-4 text-sm font-bold text-white">
                      저장
                    </button>
                  </form>
                  <span className="text-xs text-ink-sub">
                    {linked ? `연결됨: ${linked.name}` : suggest ? `추천: ${suggest.name} (저장을 누르면 연결)` : "연결 안 됨"}
                  </span>
                </li>
              );
            })}
          </ul>
        </Section>
      )}
    </>
  );
}
