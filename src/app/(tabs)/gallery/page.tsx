import PageHeader, { ComingSoon } from "@/components/PageHeader";

export const metadata = { title: "교육 사진 · 영상 | 딥테일 프리다이빙" };

export default function Page() {
  return (
    <>
      <PageHeader title="교육 사진 · 영상" back="/" />
      <ComingSoon>
        다음 단계에서 만들 화면이에요.
        <br />
        강습·투어 현장 사진 갤러리
      </ComingSoon>
    </>
  );
}
