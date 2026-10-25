import Link from "next/link";
import { requireStaff } from "@/lib/staff";
import AdminNav from "./AdminNav";

export const dynamic = "force-dynamic";
export const metadata = { title: "관리자 | 딥테일 프리다이빙" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStaff();
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="sticky top-0 z-10 bg-brand-gradient text-white">
        <div className="flex h-14 items-center justify-between px-4">
          <span className="text-base font-extrabold tracking-wide">DEEPTAIL 관리자</span>
          <Link href="/" className="flex min-h-11 items-center rounded-full bg-white/15 px-4 text-xs font-bold">
            {session.user.name} · 앱으로
          </Link>
        </div>
        <AdminNav />
      </header>
      <main className="flex-1 pb-10">{children}</main>
    </div>
  );
}
