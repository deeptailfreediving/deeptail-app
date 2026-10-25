"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ErrorText } from "@/components/form";
import { createSchedule, type FormState } from "../actions";

const TYPES = [
  { value: "SELF_PRACTICE", label: "자율연습반", title: "자율연습반" },
  { value: "REGULAR_TRAINING", label: "정기트레이닝", title: "정기트레이닝" },
  { value: "OVERSEAS_TOUR", label: "해외투어", title: "" },
];

const input = "h-12 rounded-xl border border-line bg-white px-3 text-base w-full";

export default function ScheduleForm({ locations, minDate }: { locations: { id: string; name: string }[]; minDate: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useFormState<FormState, FormData>(createSchedule, {});
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.at, state.ok]);
  const [type, setType] = useState("SELF_PRACTICE");
  const [title, setTitle] = useState("자율연습반");
  const isTour = type === "OVERSEAS_TOUR";

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card">
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="일정 종류">
        {TYPES.map((t) => (
          <label
            key={t.value}
            className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl border text-sm font-bold ${
              type === t.value ? "border-brand bg-brand text-white" : "border-line"
            }`}
          >
            <input
              type="radio"
              name="type"
              value={t.value}
              checked={type === t.value}
              onChange={() => {
                setType(t.value);
                setTitle(t.title);
              }}
              className="sr-only"
            />
            {t.label}
          </label>
        ))}
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">제목</span>
        <input
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isTour ? "예) 이시가키 만타 프리다이빙 투어" : ""}
          className={input}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">장소</span>
        <select name="locationId" defaultValue="" className={input}>
          <option value="">{isTour ? "해외 (장소 목록 외)" : "장소를 선택하세요"}</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">{isTour ? "시작일" : "날짜"}</span>
          <input type="date" name="date" required min={minDate} className={input} />
        </label>
        {isTour ? (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">종료일</span>
            <input type="date" name="endDate" required min={minDate} className={input} />
          </label>
        ) : (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">반복</span>
            <select name="repeatWeeks" defaultValue="1" className={input}>
              <option value="1">한 번만</option>
              <option value="4">매주 · 4주</option>
              <option value="8">매주 · 8주</option>
              <option value="12">매주 · 12주</option>
            </select>
          </label>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">시작 시간</span>
          <input type="time" name="startTime" required defaultValue="10:00" step={1800} className={input} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">종료 시간</span>
          <input type="time" name="endTime" required defaultValue="13:00" step={1800} className={input} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">정원 (선택)</span>
          <input name="capacity" inputMode="numeric" placeholder="제한 없음" className={input} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">참가비 (원)</span>
          <input name="fee" inputMode="numeric" placeholder={isTour ? "예) 1500000" : "무료"} className={input} />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">안내 문구 (선택)</span>
        <textarea name="note" rows={2} maxLength={300} className="rounded-xl border border-line p-3 text-base" />
      </label>

      <p className="text-xs text-ink-mute">담당자 이름·연락처는 등록하는 사람 정보로 자동 입력돼요.</p>
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
      {pending ? "등록 중…" : "일정 등록"}
    </button>
  );
}
