import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { ChevronIcon } from "@/components/icons";
import { decks } from "@/lib/materialDecks";

export const metadata = { title: "교육자료 | 딥테일 프리다이빙" };

const items = [
  { href: "/materials/equalizing", title: "이퀄라이징", desc: "귀가 아프기 전에 끝내는 법 · 방법 4가지 · 안 될 때", ready: true },
  ...decks.map((d) => ({ href: `/materials/cards/${d.slug}`, title: d.title, desc: d.desc, ready: true })),
  { href: "/pools", title: "풀장 이용 안내", desc: "입장료 · 준비물 · 도착해서 할 일", ready: true },
];

export default function MaterialsPage() {
  return (
    <>
      <PageHeader title="교육자료" back="/" />
      <ul className="flex flex-col gap-2.5 p-4">
        {items.map((it) =>
          it.ready ? (
            <li key={it.title}>
              <Link href={it.href} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card">
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-base font-bold">{it.title}</span>
                  <span className="text-xs text-ink-sub">{it.desc}</span>
                </span>
                <ChevronIcon className="h-5 w-5 text-ink-mute" />
              </Link>
            </li>
          ) : (
            <li key={it.title} className="flex flex-col gap-0.5 rounded-2xl border border-dashed border-line p-4">
              <span className="text-base font-bold text-ink-mute">{it.title}</span>
              <span className="text-xs text-ink-mute">{it.desc}</span>
            </li>
          ),
        )}
      </ul>
    </>
  );
}
