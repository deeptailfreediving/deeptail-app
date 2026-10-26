"use client";

import { useRef, useState } from "react";

// 사진을 고르면 휴대폰에서 바로 줄여서(긴 변 maxSize px, JPEG) 숨은 입력칸에 담아 보냄
// → 올리는 속도가 빠르고 서버 용량 제한(1MB)에 걸리지 않음
async function shrink(file: File, maxSize: number): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("이 사진 형식은 열 수 없어요. 다른 사진(JPG·PNG)을 골라 주세요."));
      i.src = url;
    });
    const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    let q = 0.85;
    let out = canvas.toDataURL("image/jpeg", q);
    while (out.length > 1_300_000 && q > 0.4) {
      q -= 0.1;
      out = canvas.toDataURL("image/jpeg", q);
    }
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function ImagePicker({
  name,
  label,
  hint,
  maxSize = 1600,
}: {
  name: string;
  label: string;
  hint?: string;
  maxSize?: number;
}) {
  const [data, setData] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setError("");
    try {
      setData(await shrink(f, maxSize));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-bold">{label}</span>
      <input type="hidden" name={name} value={data} />
      <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
      <div className="flex items-center gap-3">
        {data ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data} alt="고른 사진" className="h-20 w-20 rounded-xl border border-line object-cover" />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-line text-xs text-ink-mute">
            사진 없음
          </span>
        )}
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="min-h-10 rounded-xl border border-brand px-4 text-sm font-bold text-brand disabled:opacity-60"
          >
            {busy ? "준비 중…" : data ? "다시 고르기" : "사진 고르기"}
          </button>
          {data && (
            <button
              type="button"
              onClick={() => {
                setData("");
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="text-left text-xs text-ink-mute underline"
            >
              빼기
            </button>
          )}
        </div>
      </div>
      {hint && <span className="text-xs text-ink-mute">{hint}</span>}
      {error && <span className="text-xs font-bold text-red-700">{error}</span>}
    </div>
  );
}
