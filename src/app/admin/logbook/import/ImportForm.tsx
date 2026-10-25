"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ErrorText } from "@/components/form";
import { importLogs, type FormState } from "../../actions";

const input = "h-12 w-full rounded-xl border border-line bg-white px-3 text-base";

export default function ImportForm({ users }: { users: { id: string; name: string; email: string }[] }) {
  const [state, action] = useFormState<FormState, FormData>(importLogs, {});
  // 파일은 브라우저에서 읽어 내용만 보냄 (한글 파일명 업로드가 비는 문제 회피)
  const [json, setJson] = useState("");
  const [fileInfo, setFileInfo] = useState("");
  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">기록을 넣을 회원</span>
        <select name="userId" required defaultValue="" className={input}>
          <option value="" disabled>
            회원을 선택하세요
          </option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} · {u.email}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">가져오기 파일 (.json)</span>
        <input
          type="file"
          accept=".json,application/json"
          className="text-sm"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const text = await f.text();
            setJson(text);
            try {
              const n = JSON.parse(text)?.records?.length;
              setFileInfo(n ? `${f.name} · 기록 ${n}건` : f.name);
            } catch {
              setFileInfo(`${f.name} · 형식을 읽을 수 없어요`);
            }
          }}
        />
        {fileInfo && <span className="text-xs text-ink-sub">{fileInfo}</span>}
      </label>
      <details className="text-sm">
        <summary className="cursor-pointer text-ink-sub">파일 대신 내용 붙여넣기</summary>
        <textarea
          name="json"
          rows={6}
          value={json}
          onChange={(e) => setJson(e.target.value)}
          className="mt-2 w-full rounded-xl border border-line p-3 font-mono text-xs"
        />
      </details>
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" name="skipDuplicates" defaultChecked className="h-5 w-5 accent-brand" />
        이미 있는 기록(같은 날짜·목적·장소)은 건너뛰기
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
      {pending ? "가져오는 중…" : "가져오기"}
    </button>
  );
}
