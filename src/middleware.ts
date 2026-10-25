import { withAuth } from "next-auth/middleware";

// 로그인해야 들어갈 수 있는 화면
// - 마이페이지, 교육자료, 일정 신청
// - 관리자 화면 (강사·대표만, src/lib/staff.ts에서 확인)
export default withAuth({
  callbacks: {
    // 로그인만 여기서 확인. 관리자 권한은 /admin 화면에서 확인하고, 권한이 없으면 홈으로 보냄
    authorized({ token }) {
      return Boolean(token);
    },
  },
});

export const config = {
  matcher: ["/my/:path*", "/materials/:path*", "/schedule/apply/:path*", "/admin/:path*"],
};
