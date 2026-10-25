import Link from "next/link";
import { BackIcon } from "@/components/icons";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="flex h-14 items-center px-2">
        <Link href="/" aria-label="홈으로" className="flex h-11 w-11 items-center justify-center rounded-full text-ink">
          <BackIcon className="h-6 w-6" />
        </Link>
      </header>
      <main className="flex-1 px-6 pb-10">{children}</main>
    </div>
  );
}
