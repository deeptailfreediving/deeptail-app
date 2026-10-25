import PageHeader, { ComingSoon } from "@/components/PageHeader";

export const metadata = { title: "강습 · 투어 후기 | 딥테일 프리다이빙" };

export default function Page() {
  return (
    <>
      <PageHeader title="강습 · 투어 후기" back="/" />
      <ComingSoon>
        다음 단계에서 만들 화면이에요.
        <br />
        네이버 카페 후기글 링크 목록
      </ComingSoon>
    </>
  );
}
