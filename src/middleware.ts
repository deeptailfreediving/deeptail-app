import { withAuth } from "next-auth/middleware";

// 로그인해야 들어갈 수 있는 화면
// - 마이페이지, 교육자료, 일정 신청
// - 관리자 화면은 강사·대표만
export default withAuth({
  callbacks: {
    authorized({ token, req }) {
      if (!token) return false;
      if (req.nextUrl.pathname.startsWith("/admin")) {
        return token.role === "ADMIN" || token.role === "INSTRUCTOR";
      }
      return true;
    },
  },
});

export const config = {
  matcher: ["/my/:path*", "/materials/:path*", "/schedule/apply/:path*", "/admin/:path*"],
};
