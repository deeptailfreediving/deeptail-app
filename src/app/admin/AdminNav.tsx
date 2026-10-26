"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "신청 관리" },
  { href: "/admin/schedules", label: "일정" },
  { href: "/admin/logbook", label: "로그북" },
  { href: "/admin/notices", label: "공지" },
  { href: "/admin/reviews", label: "후기" },
  { href: "/admin/notion", label: "노션" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="관리자 메뉴" className="grid grid-cols-6 px-1">
      {tabs.map((t) => {
        const active = t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center border-b-2 text-[12px] font-bold ${
              active ? "border-white text-white" : "border-transparent text-brand-soft"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
