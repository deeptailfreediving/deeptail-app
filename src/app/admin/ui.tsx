import StatusBadge from "@/components/StatusBadge";
import LevelBadge from "@/components/LevelBadge";
import type { AdminRequest } from "@/lib/requests";
import { paymentLabel } from "@/lib/requests";
import { won } from "@/lib/pricing";
import { hm, longDate } from "@/lib/time";

export function Flash({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p role="status" className="mx-4 mt-4 rounded-xl bg-brand-tint px-4 py-3 text-sm font-medium text-brand-mid">
      {msg}
    </p>
  );
}

export function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="mx-4 mt-5 flex flex-col gap-2">
      <h2 className="mx-1 flex items-center gap-2 text-base font-bold">
        {title}
        {count != null && (
          <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">{count}</span>
        )}
      </h2>
      {children}
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl bg-white p-5 text-center text-sm text-ink-mute shadow-card">{children}</p>;
}

/** 신청 한 건 카드 + 처리 버튼 */
export function RequestCard({ req, children }: { req: AdminRequest; children?: React.ReactNode }) {
  const rentals = [
    req.rentMaskSnorkel && "마스크·스노클",
    req.rentLongFin && "롱핀",
    req.rentWeight && "웨이트",
    req.rentSuit && "슈트",
  ].filter(Boolean);
  return (
    <li className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="text-[15px] font-bold">
            {req.studentName}
            <LevelBadge level={req.studentLevel} />{" "}
            <a href={`tel:${req.studentPhone}`} className="text-xs font-medium text-brand">
              {req.studentPhone}
            </a>
          </span>
          <span className="truncate text-sm text-ink-sub">{req.title}</span>
        </div>
        <StatusBadge status={req.status} />
      </div>
      <p className="text-sm">
        {req.startsAt ? `${longDate(req.startsAt)} ${hm(req.startsAt)}~${req.endsAt ? hm(req.endsAt) : ""}` : "시간 미정"} ·{" "}
        {req.location ?? "장소 미정"}
      </p>
      {(rentals.length > 0 || req.memo) && (
        <p className="text-xs text-ink-sub">
          {rentals.length > 0 &&
            `장비 ${rentals.join(", ")}${req.finSize ? ` · 발 ${req.finSize}mm` : ""}${req.weightKg ? ` · ${req.weightKg}kg` : ""}`}
          {rentals.length > 0 && req.memo && <br />}
          {req.memo && `요청: ${req.memo}`}
        </p>
      )}
      <p className="text-xs text-ink-mute">
        {req.total > 0 ? `${won(req.total)} · ` : ""}
        {paymentLabel[req.paymentStatus]}
      </p>
      {children && <div className="flex flex-wrap gap-2 pt-1">{children}</div>}
    </li>
  );
}

export function ActionButton({
  action,
  children,
  tone = "primary",
}: {
  action: () => Promise<void>;
  children: React.ReactNode;
  tone?: "primary" | "quiet" | "danger";
}) {
  const style =
    tone === "primary"
      ? "bg-brand text-white"
      : tone === "danger"
        ? "border border-red-200 text-red-700"
        : "border border-line text-ink";
  return (
    <form action={action}>
      <button type="submit" className={`min-h-11 rounded-xl px-4 text-sm font-bold ${style}`}>
        {children}
      </button>
    </form>
  );
}
