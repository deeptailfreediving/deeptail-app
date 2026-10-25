// 화면을 불러오는 동안 누른 즉시 보여주는 자리표시 (모양만 비슷하게)
export default function PageSkeleton({ header = true, cards = 3 }: { header?: boolean; cards?: number }) {
  return (
    <div aria-busy="true" aria-label="불러오는 중" className="animate-fade-in">
      {header && (
        <div className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-line bg-white px-4">
          <span className="skeleton h-5 w-32" />
        </div>
      )}
      <div className="flex flex-col gap-3 p-4">
        <span className="skeleton h-5 w-24" />
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="flex flex-col gap-2.5 rounded-2xl bg-white p-4 shadow-card">
            <span className="skeleton h-4 w-16" />
            <span className="skeleton h-5 w-3/4" />
            <span className="skeleton h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
