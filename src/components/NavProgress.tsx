"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// 링크를 누르는 즉시 화면 위쪽에 진행 막대 표시 → 다음 화면이 뜨면 사라짐
export default function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [active, setActive] = useState(false);
  const pressed = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      pressed.current?.removeAttribute("data-pending");
      a.setAttribute("data-pending", "true");
      pressed.current = a;
      setActive(true);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // 화면이 바뀌면 끝
  useEffect(() => {
    setActive(false);
    pressed.current?.removeAttribute("data-pending");
    pressed.current = null;
  }, [pathname, search]);

  // 혹시 이동이 취소돼도 막대가 남지 않게
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setActive(false), 8000);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 top-0 z-[90] h-[3px] transition-opacity duration-200 ${
        active ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className={`h-full bg-brand ${active ? "animate-nav-progress" : "w-0"}`} />
    </div>
  );
}
