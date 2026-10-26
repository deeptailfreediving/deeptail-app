// 교육자료·안내 글 공통 모양 (두괄식: 질문 → 결론 → 이유 → 방법)

export function Hook({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <section className="mx-4 mt-4 flex flex-col gap-3 rounded-2xl bg-brand-gradient p-5 text-white">
      <p className="text-[20px] font-bold leading-snug">{question}</p>
      <div className="flex flex-col gap-2 text-sm leading-relaxed text-brand-soft">{children}</div>
    </section>
  );
}

/** 결론 먼저: 번호 붙은 핵심 3줄 */
export function KeyPoints({ title = "결론부터", items }: { title?: string; items: React.ReactNode[] }) {
  return (
    <section className="mx-4 mt-4 flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-card">
      <h2 className="text-base font-bold">{title}</h2>
      <ol className="flex flex-col gap-2.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
              {i + 1}
            </span>
            <span>{it}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Block({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="mx-4 mt-4 flex scroll-mt-20 flex-col gap-3 rounded-2xl bg-white p-5 shadow-card">
      <h2 className="text-base font-bold">{title}</h2>
      <div className="flex flex-col gap-2.5 text-[15px] leading-relaxed text-ink">{children}</div>
    </section>
  );
}

export function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2">
          <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="flex flex-col gap-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2.5">
          <b className="w-5 shrink-0 text-brand">{i + 1}.</b>
          <span>{it}</span>
        </li>
      ))}
    </ol>
  );
}

export function Note({ tone = "info", children }: { tone?: "info" | "warn"; children: React.ReactNode }) {
  return (
    <div
      className={`rounded-xl p-3.5 text-sm leading-relaxed ${
        tone === "warn" ? "bg-red-50 text-red-900" : "bg-brand-tint text-brand-mid"
      }`}
    >
      {children}
    </div>
  );
}

/** 증상 → 원인 → 해결 */
export function Trouble({ rows }: { rows: { when: string; why: string; fix: string }[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((r) => (
        <li key={r.when} className="flex flex-col gap-1 rounded-xl border border-line p-3.5 text-sm">
          <b className="text-[15px]">{r.when}</b>
          <span className="text-ink-sub">
            <b className="text-ink">원인</b> · {r.why}
          </span>
          <span className="text-ink-sub">
            <b className="text-brand">이렇게</b> · {r.fix}
          </span>
        </li>
      ))}
    </ul>
  );
}
