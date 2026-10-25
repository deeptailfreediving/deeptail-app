"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { ErrorText, Field, PrimaryButton } from "@/components/form";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";
  const joined = params.get("joined") === "1";
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(undefined);
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });
    setPending(false);
    if (!res || res.error) {
      setError("이메일 또는 비밀번호가 맞지 않아요.");
      return;
    }
    router.replace(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {joined && (
        <p className="rounded-lg bg-brand-tint px-3 py-2 text-sm text-brand-mid">
          가입이 완료됐어요. 로그인해 주세요.
        </p>
      )}
      <Field label="이메일" name="email" type="email" autoComplete="email" />
      <Field label="비밀번호" name="password" type="password" autoComplete="current-password" />
      <ErrorText>{error}</ErrorText>
      <PrimaryButton disabled={pending}>{pending ? "로그인 중…" : "로그인"}</PrimaryButton>
      <p className="text-center text-sm text-ink-sub">
        아직 회원이 아니신가요?{" "}
        <Link href="/signup" className="font-bold text-brand">
          회원가입
        </Link>
      </p>
    </form>
  );
}
