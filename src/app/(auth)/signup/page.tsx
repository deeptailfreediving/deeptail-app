"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { ErrorText, Field, PrimaryButton } from "@/components/form";
import { signup, type SignupState } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return <PrimaryButton disabled={pending}>{pending ? "가입 중…" : "가입하기"}</PrimaryButton>;
}

export default function SignupPage() {
  const [state, action] = useFormState<SignupState, FormData>(signup, {});

  return (
    <div className="flex flex-col gap-8 pt-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">회원가입</h1>
        <p className="text-sm text-ink-sub">딥테일 교육생이 되어 수업을 신청해 보세요.</p>
      </div>
      <form action={action} className="flex flex-col gap-4">
        <Field label="이름" name="name" autoComplete="name" />
        <Field label="이메일" name="email" type="email" autoComplete="email" />
        <Field
          label="휴대폰 번호"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="010-1234-5678"
        />
        <Field label="생년월일" name="birthDate" type="date" autoComplete="bday" />
        <Field
          label="비밀번호"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="8자 이상"
        />
        <Field label="비밀번호 확인" name="passwordConfirm" type="password" autoComplete="new-password" />

        <label className="flex items-start gap-3 rounded-xl bg-canvas p-4 text-sm">
          <input type="checkbox" name="agreePrivacy" required className="mt-0.5 h-5 w-5 accent-brand" />
          <span>
            <b>[필수]</b> 개인정보 수집·이용에 동의합니다.
            <span className="mt-1 block text-xs text-ink-mute">
              이름, 이메일, 휴대폰 번호, 생년월일 · 교육 신청과 안내에 사용 · [보관 기간]
            </span>
          </span>
        </label>

        <ErrorText>{state.error}</ErrorText>
        <Submit />
        <p className="text-center text-sm text-ink-sub">
          이미 회원이신가요?{" "}
          <Link href="/login" className="font-bold text-brand">
            로그인
          </Link>
        </p>
      </form>
    </div>
  );
}
