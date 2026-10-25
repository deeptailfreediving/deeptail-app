import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Splash from "@/components/Splash";
import NavProgress from "@/components/NavProgress";
import { Suspense } from "react";

// Pretendard (SIL Open Font License) — 프로젝트에 포함되어 외부 요청 없이 로드
// 용량을 줄이려고 한글 완성형 2,350자 + 영문·기호만 남김 (2MB → 0.5MB). 그 외 글자는 기기 기본 글꼴로 보임
const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  weight: "45 920",
  variable: "--font-pretendard",
  display: "swap",
});

export const metadata: Metadata = {
  title: "딥테일 프리다이빙",
  description: "딥테일 프리다이빙 교육 일정·예약·로그북",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "딥테일", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#036DB7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={pretendard.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Splash />
        <Suspense fallback={null}>
          <NavProgress />
        </Suspense>
        {/* 휴대폰 화면 폭 기준으로 가운데 정렬 */}
        <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-canvas">{children}</div>
      </body>
    </html>
  );
}
