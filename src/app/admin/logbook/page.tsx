import { DISCIPLINES, fmtRecord, listLogsForStaff, noteOf, purposeLabel, recordOf, type DiveLog } from "@/lib/logbook";
import { md, weekday } from "@/lib/time";
import { reviewLog } from "../actions";
import { Empty, Section } from "../ui";
import FeedbackForm from "./FeedbackForm";

export default async function AdminLogbook() {
  const [todo, done] = await Promise.all([listLogsForStaff(false), listLogsForStaff(true)]);
  return (
    <>
      <Section title="확인 전 로그" count={todo.length}>
        {todo.length === 0 ? (
          <Empty>확인할 로그가 없어요.</Empty>
        ) : (
          <ul className="flex flex-col gap-2">
            {todo.map((l) => (
              <LogCard key={l.id} log={l}>
                <FeedbackForm action={reviewLog.bind(null, l.id)} initial={l.feedback} />
              </LogCard>
            ))}
          </ul>
        )}
      </Section>

      <Section title="최근 확인한 로그">
        {done.length === 0 ? (
          <Empty>아직 없어요.</Empty>
        ) : (
          <ul className="flex flex-col gap-2">
            {done.map((l) => (
              <LogCard key={l.id} log={l}>
                <FeedbackForm action={reviewLog.bind(null, l.id)} initial={l.feedback} reviewed />
              </LogCard>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}

function LogCard({ log, children }: { log: DiveLog & { studentName: string }; children: React.ReactNode }) {
  const recs = DISCIPLINES.map((dc) => ({ dc, v: recordOf(log, dc.key), note: noteOf(log, dc.key) })).filter(
    (r) => r.v != null || (r.note && r.note !== "-"),
  );
  return (
    <li className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-card">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[15px] font-bold">{log.studentName}</span>
        <span className="text-xs text-ink-sub">
          {md(log.diveDate)} ({weekday(log.diveDate)})
        </span>
      </div>
      <p className="text-xs text-ink-sub">
        {purposeLabel[log.purpose]} · {log.place}
        {log.suit && ` · ${log.suit}`}
        {log.weight && log.weight !== "-" && ` · ${log.weight}`}
      </p>
      {log.activity && <p className="whitespace-pre-line text-sm">{log.activity}</p>}
      {recs.map(({ dc, v, note }) => (
        <div key={dc.key} className="rounded-xl bg-canvas p-3 text-sm">
          <p>
            <b className="text-brand">{dc.code}</b> {v != null ? fmtRecord(dc.key, v) : ""}
          </p>
          {note && note !== "-" && <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-ink-sub">{note}</p>}
        </div>
      ))}
      {children}
    </li>
  );
}
