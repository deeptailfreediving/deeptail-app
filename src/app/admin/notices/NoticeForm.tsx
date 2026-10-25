"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ErrorText } from "@/components/form";
import { createNotice, type FormState } from "../actions";

const input = "h-12 rounded-xl border border-line bg-white px-3 text-base w-full";

export default function NoticeForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useFormState<FormState, FormData>(createNotice, {});
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.at, state.ok]);
  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">분류</span>
        <select name="category" defaultValue="GENERAL" className={input}>
          <option value="TOUR">투어</option>
          <option value="EVENT">행사</option>
          <option value="GENERAL">공지</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">제목</span>
        <input name="title" required maxLength={80} className={input} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">한 줄 요약 (홈 카드에 표시)</span>
        <input name="summary" maxLength={80} placeholder="예) 11월 26일(목) ~ 29일(일)" className={input} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">내용</span>
        <textarea name="body" rows={5} maxLength={3000} className="rounded-xl border border-line p-3 text-base" />
      </label>
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" name="pinned" className="h-5 w-5 accent-brand" />
        홈 화면 맨 위에 고정
      </label>
      <ErrorText>{state.error}</ErrorText>
      {state.ok && (
        <p role="status" className="rounded-lg bg-brand-tint px-3 py-2 text-sm font-medium text-brand-mid">
          {state.ok}
        </p>
      )}
      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="h-12 rounded-xl bg-brand font-bold text-white disabled:opacity-60">
      {pending ? "등록 중…" : "공지 등록"}
    </button>
  );
}
