import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Pretendard (SIL Open Font License) — 프로젝트에 포함되어 외부 요청 없이 로드
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
};

export const viewport: Viewport = {
  themeColor: "#036DB7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body className="font-sans antialiased">
        {/* 휴대폰 화면 폭 기준으로 가운데 정렬 */}
        <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-canvas">{children}</div>
      </body>
    </html>
  );
}
