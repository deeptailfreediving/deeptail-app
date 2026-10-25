import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata = { title: "로그인 | 딥테일 프리다이빙" };

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-8 pt-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">로그인</h1>
        <p className="text-sm text-ink-sub">수업 신청과 로그북은 로그인 후 이용할 수 있어요.</p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
