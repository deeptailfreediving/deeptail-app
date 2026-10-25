// 로그북 차트 — 단일 시리즈(브랜드 블루), 막대 끝 4px 둥글게, 2px 선, 호버 시 <title> 툴팁

const BRAND = "#036DB7";
const GRID = "#E4EAF0";
const INK_MUTE = "#5D6E7E";
const BEST = "#D92D20"; // 최고 기록 포인트 (붉은색)

/** 최근 6개월 월별 다이빙 횟수 */
export function MonthlyBars({ months }: { months: { key: string; label: string; count: number }[] }) {
  const W = 320;
  const H = 120;
  const top = 18;
  const bottom = 22;
  const max = Math.max(1, ...months.map((m) => m.count));
  const slot = W / months.length;
  const bw = Math.min(28, slot - 16);
  const y = (v: number) => top + (H - top - bottom) * (1 - v / max);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`월별 다이빙 횟수: ${months.map((m) => `${m.label} ${m.count}회`).join(", ")}`}>
      <line x1="0" x2={W} y1={H - bottom} y2={H - bottom} stroke={GRID} />
      {months.map((m, i) => {
        const x = i * slot + (slot - bw) / 2;
        const yy = y(m.count);
        return (
          <g key={m.key}>
            <title>{`${m.label} · ${m.count}회`}</title>
            {/* 넓은 호버 영역 */}
            <rect x={i * slot} y={0} width={slot} height={H} fill="transparent" />
            {m.count > 0 && (
              <path
                d={`M${x},${H - bottom} V${yy + 4} Q${x},${yy} ${x + 4},${yy} H${x + bw - 4} Q${x + bw},${yy} ${x + bw},${yy + 4} V${H - bottom} Z`}
                fill={BRAND}
              />
            )}
            {m.count > 0 && (
              <text x={x + bw / 2} y={yy - 5} textAnchor="middle" fontSize="11" fontWeight="700" fill="#10202E">
                {m.count}
              </text>
            )}
            <text x={x + bw / 2} y={H - 6} textAnchor="middle" fontSize="11" fill={INK_MUTE}>
              {m.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** 종목별 기록 추이 (최근 12회) */
export function TrendLine({
  points,
  format,
  label,
}: {
  points: { date: string; v: number }[];
  format: (v: number) => string;
  label: string;
}) {
  const W = 300;
  const H = 84;
  const pad = 10;
  const padTop = 22; // 값 라벨 자리
  if (points.length < 2) {
    return <p className="py-3 text-xs text-ink-mute">기록이 2개 이상 쌓이면 추이가 보여요.</p>;
  }
  const vs = points.map((p) => p.v);
  const lo = Math.min(...vs);
  const hi = Math.max(...vs);
  const span = hi - lo || 1;
  const X = (i: number) => pad + (i * (W - pad * 2)) / (points.length - 1);
  const Y = (v: number) => padTop + (H - padTop - pad) * (1 - (v - lo) / span);
  const d = points.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(p.v).toFixed(1)}`).join(" ");
  const bestIdx = vs.lastIndexOf(hi);
  const lastIdx = points.length - 1;
  // 처음 · 최고 · 최근 값만 직접 라벨 (모든 점에 숫자를 달지 않음)
  // 최고 기록 라벨과 겹치면(가로 70 이내) 처음·최근 라벨은 생략
  const labeled = Array.from(new Set([bestIdx, 0, lastIdx])).filter(
    (i) => i === bestIdx || Math.abs(X(i) - X(bestIdx)) > 70,
  );
  const anchor = (i: number) => (i === 0 ? "start" : i === lastIdx ? "end" : "middle");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${label} 기록 추이, 최고 ${format(hi)}`}>
      <path d={d} fill="none" stroke={BRAND} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={`${p.date}-${i}`}>
          <title>{`${p.date.slice(5).replace("-", "/")} · ${format(p.v)}${i === bestIdx ? " · 최고 기록" : ""}`}</title>
          <circle cx={X(i)} cy={Y(p.v)} r="10" fill="transparent" />
          <circle cx={X(i)} cy={Y(p.v)} r={i === bestIdx ? 5 : 3} fill={i === bestIdx ? BEST : BRAND} stroke="#fff" strokeWidth="2" />
        </g>
      ))}
      {labeled.map((i) => (
        <text
          key={`lbl-${i}`}
          x={X(i)}
          y={Y(points[i].v) - 9}
          textAnchor={anchor(i)}
          fontSize="11"
          fontWeight={i === bestIdx ? 700 : 400}
          fill={i === bestIdx ? BEST : INK_MUTE}
        >
          {format(points[i].v)}
        </text>
      ))}
    </svg>
  );
}
