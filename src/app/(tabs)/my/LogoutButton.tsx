"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="min-h-11 rounded-full border border-line px-4 text-sm font-medium text-ink-sub"
    >
      로그아웃
    </button>
  );
}
