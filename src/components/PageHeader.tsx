import Link from "next/link";
import { BackIcon } from "./icons";

export default function PageHeader({ title, back }: { title: string; back?: string }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-1 border-b border-line bg-white px-2">
      {back ? (
        <Link href={back} aria-label="뒤로" className="flex h-11 w-11 items-center justify-center rounded-full">
          <BackIcon className="h-6 w-6" />
        </Link>
      ) : (
        <span className="w-3" />
      )}
      <h1 className="text-lg font-bold">{title}</h1>
    </header>
  );
}

export function ComingSoon({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-4 mt-6 rounded-2xl border border-dashed border-brand/40 bg-white p-6 text-center text-sm leading-relaxed text-ink-sub">
      {children}
    </div>
  );
}
