import { eq } from "drizzle-orm";
import { db, tables } from "@/db";
import { requireAdmin } from "@/lib/staff";
import { getSetting } from "@/lib/settings";
import { notifyChannels } from "@/lib/notify";
import { pushEnabled } from "@/lib/push";
import { saveNaverBookingUrl, sendTestNotification } from "../actions";
import { Flash, Section } from "../ui";

export const dynamic = "force-dynamic";

const input = "min-h-11 rounded-xl border border-line px-3 text-sm";

export default async function AdminSettings({ searchParams }: { searchParams: { msg?: string } }) {
  const session = await requireAdmin();
  const naverUrl = await getSetting("naver_booking_url");
  const [me] = await db.select({ phone: tables.users.phone }).from(tables.users).where(eq(tables.users.id, session.user.id));
  const ch = notifyChannels();

  const Row = ({ ok, label, detail }: { ok: boolean; label: string; detail: string }) => (
    <li className="flex items-start gap-3 py-2.5">
      <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${ok ? "bg-emerald-100 text-emerald-900" : "bg-canvas text-ink-mute"}`}>
        {ok ? "켜짐" : "꺼짐"}
      </span>
      <span className="flex flex-col text-sm">
        <b>{label}</b>
        <span className="text-xs text-ink-sub">{detail}</span>
      </span>
    </li>
  );

  return (
    <>
      <Flash msg={searchParams.msg} />

      <Section title="결제 방법">
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 text-sm shadow-card">
          <p className="text-xs text-ink-sub">
            교육생은 신청할 때 <b>계좌이체 · 현장 카드결제</b> 중에서 고를 수 있어요. 아래에 네이버 예약 주소를 넣으면{" "}
            <b>네이버 예약(카드·네이버페이)</b>도 결제 방법으로 나와요. 네이버에서 결제가 끝나면 신청 관리에서 &lsquo;결제 확인&rsquo;을 눌러 주세요.
          </p>
          <form action={saveNaverBookingUrl} className="flex flex-col gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold">네이버 예약 페이지 주소</span>
              <input name="url" defaultValue={naverUrl ?? ""} placeholder="https://booking.naver.com/booking/..." className={input} />
            </label>
            <button className="min-h-11 rounded-xl bg-brand text-sm font-bold text-white">저장</button>
            <span className="text-xs text-ink-mute">비우고 저장하면 네이버 예약 결제가 꺼져요.</span>
          </form>
        </div>
      </Section>

      <Section title="신청 알림">
        <ul className="divide-y divide-line rounded-2xl bg-white px-4 shadow-card">
          <Row ok={pushEnabled()} label="앱 푸시" detail="알림을 켠 교육생·강사에게 무료로 보내요 (교육생: 접수·확정·반려·결제 확인 / 강사·대표: 새 신청)" />
          <Row ok={ch.sms} label="문자 (솔라피)" detail="SOLAPI_API_KEY · SOLAPI_API_SECRET · SOLAPI_SENDER" />
          <Row ok={ch.sms && ch.kakao} label="카카오 알림톡 (솔라피)" detail="SOLAPI_KAKAO_PFID + 템플릿 ID (SOLAPI_TPL_RECEIVED 등). 템플릿이 없는 알림은 문자로 보내요" />
          <Row ok={ch.email} label="이메일" detail="SMTP_HOST · SMTP_PORT · SMTP_USER · SMTP_PASS" />
          <Row ok={ch.sms && ch.adminSms} label="관리자 새 신청 문자" detail="ADMIN_NOTIFY_PHONE" />
        </ul>
        {(ch.sms || ch.email) && (
          <form action={sendTestNotification} className="mt-2 flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-card">
            <span className="text-sm font-bold">테스트 발송</span>
            <input name="phone" defaultValue={me?.phone ?? ""} placeholder="받을 휴대폰 번호" className={input} />
            <input name="email" defaultValue={session.user.email ?? ""} placeholder="받을 이메일" className={input} />
            <button className="min-h-11 rounded-xl border border-brand text-sm font-bold text-brand">테스트 보내기</button>
          </form>
        )}
      </Section>
    </>
  );
}
