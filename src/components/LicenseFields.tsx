"use client";

import { useState } from "react";
import ImagePicker from "./ImagePicker";

const AGENCIES = ["AIDA", "PADI", "SSI", "CMAS", "Molchanovs", "기타"];

const select =
  "h-12 rounded-xl border border-line bg-white px-3 text-base text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

// 프리다이빙 자격증 입력칸 (회원가입 · 마이페이지 공통). optional이면 '없음'을 고를 수 있음
export default function LicenseFields({ optional = true }: { optional?: boolean }) {
  const [agency, setAgency] = useState(optional ? "" : "AIDA");
  return (
    <fieldset className="flex flex-col gap-3 rounded-xl bg-canvas p-4">
      <legend className="sr-only">프리다이빙 자격증</legend>
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-bold">프리다이빙 자격증{optional && " (선택)"}</span>
        <span className="text-xs text-ink-sub">
          자격증이 있으면 사진을 올려 주세요. 강사가 확인하면 이름 옆에 레벨이 표시되고, 레벨 2부터 자율연습반·정기트레이닝에
          참여할 수 있어요.
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">단체</span>
          <select name="licenseAgency" value={agency} onChange={(e) => setAgency(e.target.value)} className={select}>
            {optional && <option value="">없음</option>}
            {AGENCIES.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">레벨</span>
          <select name="licenseLevel" disabled={!agency} defaultValue="" className={`${select} disabled:opacity-50`}>
            <option value="" disabled>
              선택
            </option>
            {[1, 2, 3, 4].map((l) => (
              <option key={l} value={l}>
                레벨 {l}
              </option>
            ))}
          </select>
        </label>
      </div>
      {agency && (
        <ImagePicker
          name="licenseImage"
          label="자격증 사진"
          hint="카드, 수료증, 단체 앱 화면 캡처 모두 괜찮아요. 강사·대표만 볼 수 있어요."
        />
      )}
    </fieldset>
  );
}
