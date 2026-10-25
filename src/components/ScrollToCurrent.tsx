"use client";

import { useEffect, useRef } from "react";

// 가로 스크롤 목록에서 선택된 항목이 보이도록 가운데로 이동
export default function ScrollToCurrent({ selector }: { selector: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current?.parentElement?.querySelector(selector);
    el?.scrollIntoView({ inline: "center", block: "nearest" });
  });
  return <span ref={ref} hidden />;
}
