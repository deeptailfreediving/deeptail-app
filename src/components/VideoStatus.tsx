// 노션 강습영상 상태 배지 (업로드됨 → 피드백 작성 중 → 완료)
const MAP: Record<string, { label: string; cls: string }> = {
  업로드됨: { label: "피드백 준비 중", cls: "bg-canvas text-ink-mute" },
  "피드백 작성 중": { label: "피드백 작성 중", cls: "bg-amber-100 text-amber-900" },
  완료: { label: "피드백 완료", cls: "bg-emerald-100 text-emerald-900" },
};

export default function VideoStatus({ status, hasFeedback }: { status: string; hasFeedback: boolean }) {
  const s = MAP[status] ?? (hasFeedback ? MAP["완료"] : MAP["업로드됨"]);
  return <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${s.cls}`}>{s.label}</span>;
}
