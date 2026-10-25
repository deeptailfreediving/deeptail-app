import PageHeader from "@/components/PageHeader";
import { PLACES, purposeLabel } from "@/lib/logbook";
import { todayYmd } from "@/lib/time";
import LogForm from "../LogForm";

export const metadata = { title: "로그 쓰기 | 딥테일 프리다이빙" };

export default function NewLog() {
  const today = todayYmd();
  return (
    <>
      <PageHeader title="로그 쓰기" back="/my/logbook" />
      <LogForm
        id={null}
        maxDate={today}
        places={PLACES}
        purposes={Object.entries(purposeLabel).map(([value, label]) => ({ value, label }))}
        initial={{
          diveDate: today,
          purpose: "",
          place: "",
          suit: "",
          weight: "",
          activity: "",
          staMin: "",
          staSec: "",
          staNote: "",
          dynM: "",
          dynNote: "",
          fimM: "",
          fimNote: "",
          cwtM: "",
          cwtNote: "",
        }}
      />
    </>
  );
}
