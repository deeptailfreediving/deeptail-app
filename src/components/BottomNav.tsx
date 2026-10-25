"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, CapIcon, HomeIcon, UserIcon } from "./icons";

const tabs = [
  { href: "/", label: "홈", Icon: HomeIcon },
  { href: "/schedule", label: "일정", Icon: CalendarIcon },
  { href: "/courses", label: "교육과정", Icon: CapIcon },
  { href: "/my", label: "마이페이지", Icon: UserIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="하단 메뉴"
      className="sticky bottom-0 z-10 grid grid-cols-4 border-t border-line bg-white px-1 pb-[max(env(safe-area-inset-bottom),12px)] pt-1.5"
    >
      {tabs.map(({ href, label, Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] ${
              active ? "font-bold text-brand" : "font-medium text-ink-mute"
            }`}
          >
            <Icon className="h-6 w-6" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
