"use client";

import { useState } from "react";

type Review = {
  id: string;
  url: string;
  title: string;
  excerpt: string | null;
  category: "LESSON" | "TOUR";
  pinned: boolean;
};

const tabs = [
  { key: "ALL", label: "전체" },
  { key: "LESSON", label: "강습후기" },
  { key: "TOUR", label: "투어후기" },
] as const;

export default function ReviewList({ items }: { items: Review[] }) {
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("ALL");
  const shown = tab === "ALL" ? items : items.filter((r) => r.category === tab);

  return (
    <>
      <div role="tablist" aria-label="후기 종류" className="flex gap-2 px-4 pt-4">
        {tabs.map((t) => {
          const n = t.key === "ALL" ? items.length : items.filter((r) => r.category === t.key).length;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={`flex min-h-10 items-center gap-1 rounded-full px-4 text-sm font-bold ${
                active ? "bg-brand text-white" : "bg-white text-ink-sub shadow-card"
              }`}
            >
              {t.label}
              <span className={active ? "text-brand-soft" : "text-ink-mute"}>{n}</span>
            </button>
          );
        })}
      </div>

      <ul key={tab} className="flex animate-fade-in flex-col gap-2.5 p-4">
        {shown.length === 0 && (
          <li className="rounded-2xl bg-white p-6 text-center text-sm text-ink-sub shadow-card">
            아직 모아 온 후기가 없어요.
          </li>
        )}
        {shown.map((r) => (
          <li key={r.id}>
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-1.5 rounded-2xl bg-white p-4 shadow-card"
            >
              <span className="flex items-center gap-1.5">
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                    r.category === "TOUR" ? "bg-brand-deep text-white" : "bg-brand-tint text-brand-mid"
                  }`}
                >
                  {r.category === "TOUR" ? "투어후기" : "강습후기"}
                </span>
                {r.pinned && <span className="text-[11px] font-bold text-brand">추천</span>}
              </span>
              <span className="text-[15px] font-bold leading-snug">{r.title}</span>
              {r.excerpt && <span className="line-clamp-3 text-[13px] leading-relaxed text-ink-sub">{r.excerpt}</span>}
              <span className="text-xs font-medium text-brand">카페에서 전체 보기 ↗</span>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
