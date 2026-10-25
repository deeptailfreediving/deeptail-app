import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { getSession } from "@/lib/auth";
import { getMyLog, PLACES, purposeLabel } from "@/lib/logbook";
import { todayYmd } from "@/lib/time";
import { deleteLog } from "../actions";
import LogForm from "../LogForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "로그 수정 | 딥테일 프리다이빙" };

const str = (v: number | null) => (v != null && v > 0 ? String(v) : "");

export default async function EditLog({ params }: { params: { id: string } }) {
  const session = (await getSession())!;
  const log = await getMyLog(params.id, session.user.id);
  if (!log) notFound();

  return (
    <>
      <PageHeader title="로그 수정" back="/my/logbook" />
      {log.feedback && (
        <section className="mx-4 mt-4 rounded-2xl border border-brand/30 bg-brand-tint p-4 text-sm">
          <h2 className="mb-1 font-bold text-brand-mid">강사&apos;s ONE POINT FEEDBACK</h2>
          <p className="whitespace-pre-line leading-relaxed">{log.feedback}</p>
        </section>
      )}
      <LogForm
        id={log.id}
        maxDate={todayYmd()}
        deleteAction={deleteLog.bind(null, log.id)}
        places={PLACES}
        purposes={Object.entries(purposeLabel).map(([value, label]) => ({ value, label }))}
        initial={{
          diveDate: log.diveDate,
          purpose: log.purpose,
          place: log.place,
          suit: log.suit,
          weight: log.weight,
          activity: log.activity,
          staMin: log.staSec ? String(Math.floor(log.staSec / 60)) : "",
          staSec: log.staSec ? String(log.staSec % 60) : "",
          staNote: log.staNote,
          dynM: str(log.dynM),
          dynNote: log.dynNote,
          fimM: str(log.fimM),
          fimNote: log.fimNote,
          cwtM: str(log.cwtM),
          cwtNote: log.cwtNote,
        }}
      />
    </>
  );
}
