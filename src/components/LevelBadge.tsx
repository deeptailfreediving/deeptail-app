// 이름 옆 자격 레벨 표시 (승인된 레벨만). 예: 권보규 ②
export default function LevelBadge({ level, className = "" }: { level: number | null | undefined; className?: string }) {
  if (!level) return null;
  return (
    <span
      title={`자격 레벨 ${level}`}
      aria-label={`레벨 ${level}`}
      className={`ml-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 align-[2px] text-[11px] font-extrabold leading-none text-white ${className}`}
    >
      {level}
    </span>
  );
}
