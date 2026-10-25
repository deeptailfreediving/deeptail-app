import PageHeader, { ComingSoon } from "@/components/PageHeader";

export const metadata = { title: "교육자료 | 딥테일 프리다이빙" };

export default function Page() {
  return (
    <>
      <PageHeader title="교육자료" back="/" />
      <ComingSoon>
        다음 단계에서 만들 화면이에요.
        <br />
        교육생 전용 이론 동영상 (유튜브 일부공개)
      </ComingSoon>
    </>
  );
}
