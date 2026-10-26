"use client";

import { useFormState, useFormStatus } from "react-dom";
import LicenseFields from "@/components/LicenseFields";
import { ErrorText } from "@/components/form";
import { submitLicense, type LicenseState } from "./licenseActions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="min-h-11 rounded-xl bg-brand text-sm font-bold text-white disabled:opacity-60">
      {pending ? "보내는 중…" : "승인 요청 보내기"}
    </button>
  );
}

export default function LicenseForm() {
  const [state, action] = useFormState<LicenseState, FormData>(submitLicense, {});
  if (state.ok) {
    return <p className="rounded-xl bg-brand-tint p-3 text-sm font-medium text-brand-mid">승인 요청을 보냈어요. 강사가 확인하면 이름 옆에 레벨이 표시돼요.</p>;
  }
  return (
    <form action={action} className="flex flex-col gap-3">
      <LicenseFields optional={false} />
      <ErrorText>{state.error}</ErrorText>
      <Submit />
    </form>
  );
}
