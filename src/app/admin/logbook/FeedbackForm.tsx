"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { FormState } from "../actions";

export default function FeedbackForm({
  action,
  initial,
  reviewed,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  initial: string;
  reviewed?: boolean;
}) {
  const [state, formAction] = useFormState<FormState, FormData>(action, {});
  return (
    <form action={formAction} className="flex flex-col gap-2 border-t border-line pt-3">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-bold text-brand-mid">강사&apos;s ONE POINT FEEDBACK</span>
        <textarea
          name="feedback"
          rows={3}
          maxLength={2000}
          defaultValue={initial}
          placeholder="한 가지 포인트만 짚어 주세요 (비워도 확인완료 가능)"
          className="rounded-xl border border-line p-3 text-base"
        />
      </label>
      {state.ok && (
        <p role="status" className="text-xs font-medium text-brand-mid">
          {state.ok}
        </p>
      )}
      <Submit label={reviewed ? "피드백 수정" : "확인완료"} />
    </form>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 self-end rounded-xl bg-brand px-5 text-sm font-bold text-white disabled:opacity-60"
    >
      {pending ? "저장 중…" : label}
    </button>
  );
}
