"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ErrorText } from "@/components/form";
import { saveLog, type LogState } from "./actions";

type Initial = {
  diveDate: string;
  purpose: string;
  place: string;
  suit: string;
  weight: string;
  activity: string;
  staMin: string;
  staSec: string;
  staNote: string;
  dynM: string;
  dynNote: string;
  fimM: string;
  fimNote: string;
  cwtM: string;
  cwtNote: string;
};

const input = "h-12 w-full rounded-xl border border-line bg-white px-3 text-base";
const area = "w-full rounded-xl border border-line bg-white p-3 text-base";

export default function LogForm({
  id,
  initial,
  purposes,
  places,
  maxDate,
  deleteAction,
}: {
  id: string | null;
  deleteAction?: () => Promise<void>;
  initial: Initial;
  purposes: { value: string; label: string }[];
  places: string[];
  maxDate: string;
}) {
  const [state, action] = useFormState<LogState, FormData>(saveLog.bind(null, id), {});
  const knownPlace = places.includes(initial.place) || !initial.place;
  const [placeChoice, setPlaceChoice] = useState(knownPlace ? initial.place : "__other");
  const [otherPlace, setOtherPlace] = useState(knownPlace ? "" : initial.place);

  return (
    <form action={action} className="flex flex-col gap-4 p-4 pb-36">
      <Card title="기본 정보">
        <div className="grid grid-cols-2 gap-2">
          <Label text="다이빙 날짜">
            <input type="date" name="diveDate" required max={maxDate} defaultValue={initial.diveDate} className={input} />
          </Label>
          <Label text="다이빙 목적">
            <select name="purpose" required defaultValue={initial.purpose} className={input}>
              <option value="" disabled>
                선택
              </option>
              {purposes.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </Label>
        </div>
        <Label text="장소">
          <select
            required
            value={placeChoice}
            onChange={(e) => setPlaceChoice(e.target.value)}
            className={input}
          >
            <option value="" disabled>
              장소를 선택하세요
            </option>
            {places.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
            <option value="__other">직접 입력</option>
          </select>
        </Label>
        {placeChoice === "__other" && (
          <input
            aria-label="장소 직접 입력"
            value={otherPlace}
            onChange={(e) => setOtherPlace(e.target.value)}
            placeholder="예) 세부 모알보알"
            className={input}
          />
        )}
        <input type="hidden" name="place" value={placeChoice === "__other" ? otherPlace : placeChoice} />
        <div className="grid grid-cols-2 gap-2">
          <Label text="슈트">
            <input name="suit" defaultValue={initial.suit} placeholder="예) 5mm 원피스" className={input} />
          </Label>
          <Label text="웨이트">
            <input name="weight" defaultValue={initial.weight} placeholder="예) 2kg" className={input} />
          </Label>
        </div>
        <Label text="다이빙 활동">
          <textarea name="activity" rows={3} defaultValue={initial.activity} placeholder="오늘 한 연습을 자유롭게 적어 주세요" className={area} />
        </Label>
      </Card>

      <Card title="STA 스테틱" hint="안 했으면 비워 두세요">
        <div className="grid grid-cols-2 gap-2">
          <Label text="분">
            <input name="staMin" inputMode="numeric" defaultValue={initial.staMin} placeholder="2" className={input} />
          </Label>
          <Label text="초">
            <input name="staSec" inputMode="numeric" defaultValue={initial.staSec} placeholder="30" className={input} />
          </Label>
        </div>
        <textarea
          name="staNote"
          rows={3}
          defaultValue={initial.staNote}
          placeholder="호흡충동·컨트렉션이 언제 왔는지, 느낀 점"
          aria-label="스테틱 활동 메모"
          className={area}
        />
      </Card>

      {(
        [
          ["dynM", "dynNote", "DYN 다이나믹", "50", "피닝, 턴, 컨트렉션 대처"],
          ["fimM", "fimNote", "FIM 프리이멀전", "5", "로프 잡고 내려가기 · 이퀄라이징, 자세"],
          ["cwtM", "cwtNote", "CWT 컨스턴트웨이트", "5", "덕다이빙, 피닝, 이퀄라이징"],
        ] as const
      ).map(([rec, nt, title, ph, notePh]) => (
        <Card key={rec} title={title} hint="안 했으면 비워 두세요">
          <Label text="기록 (m)">
            <input name={rec} inputMode="decimal" defaultValue={initial[rec]} placeholder={ph} className={input} />
          </Label>
          <textarea name={nt} rows={2} defaultValue={initial[nt]} placeholder={notePh} aria-label={`${title} 활동 메모`} className={area} />
        </Card>
      ))}

      <ErrorText>{state.error}</ErrorText>
      {deleteAction && (
        <button
          type="submit"
          formAction={deleteAction}
          formNoValidate
          className="min-h-11 w-full rounded-xl border border-red-200 text-sm font-bold text-red-700"
        >
          이 로그 삭제
        </button>
      )}
      <div className="fixed inset-x-0 bottom-[calc(58px+max(env(safe-area-inset-bottom),12px))] z-10 mx-auto max-w-[480px] px-4 pb-3">
        <Submit isEdit={!!id} />
      </div>
    </form>
  );
}

function Submit({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-14 w-full rounded-xl bg-brand text-base font-bold text-white shadow-card disabled:opacity-60"
    >
      {pending ? "저장 중…" : isEdit ? "수정 저장" : "로그 저장"}
    </button>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-bold text-brand">{title}</h2>
        {hint && <span className="text-xs text-ink-mute">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{text}</span>
      {children}
    </label>
  );
}
