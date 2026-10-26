"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LockIcon } from "./icons";
import LevelBadge from "./LevelBadge";

type Me = { name: string; remaining: number; level: number | null } | null;

// 같은 화면의 여러 조각이 한 번만 요청하도록 묶음
let pending: Promise<Me> | null = null;
function loadMe(): Promise<Me> {
  if (!pending) {
    pending = fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => j.user as Me)
      .catch(() => null);
    setTimeout(() => (pending = null), 500);
  }
  return pending;
}

function useMe() {
  const [me, setMe] = useState<Me | undefined>(undefined); // undefined = 불러오는 중
  useEffect(() => {
    let alive = true;
    loadMe().then((m) => alive && setMe(m));
    return () => {
      alive = false;
    };
  }, []);
  return me;
}

export function AccountButton() {
  const me = useMe();
  if (me === undefined) return <span aria-hidden className="h-11 w-24 rounded-full bg-white/15" />;
  return me ? (
    <Link href="/my" className="flex min-h-11 animate-fade-in items-center rounded-full bg-white/15 px-4 text-sm font-bold">
      {me.name}
      <LevelBadge level={me.level} className="bg-white text-brand-mid" />님
    </Link>
  ) : (
    <Link
      href="/login"
      className="flex min-h-11 animate-fade-in items-center rounded-full bg-white px-5 text-sm font-bold text-brand-mid"
    >
      로그인
    </Link>
  );
}

export function Greeting() {
  const me = useMe();
  if (me === undefined) return <span className="block h-5" />;
  return (
    <span className="animate-fade-in">
      {me
        ? me.remaining
          ? `남은 수업 ${me.remaining}회 · 일정에서 바로 신청하세요.`
          : "일정에서 자율연습과 정기트레이닝을 확인하세요."
        : "일정은 누구나 볼 수 있어요. 신청할 때만 로그인하면 돼요."}
    </span>
  );
}

export function MembersOnlyBadge() {
  const me = useMe();
  if (me !== null) return null;
  return (
    <span className="flex items-center gap-1 text-[11px] font-medium text-ink-mute">
      <LockIcon className="h-3 w-3" />
      교육생 전용
    </span>
  );
}
