// 푸시 공개키를 실행 시점에 전달 (빌드 때 환경변수가 빠져도 동작하도록)
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? process.env.VAPID_PUBLIC_KEY ?? "";
  return NextResponse.json({ key });
}
