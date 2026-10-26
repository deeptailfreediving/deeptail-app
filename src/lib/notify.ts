// 신청 알림: 교육생에게 문자/카카오 알림톡 · 이메일 · 앱 푸시, 관리자에게 새 신청 알림
// 설정된 채널만 보냄 (환경변수가 없으면 조용히 건너뜀)
//
// 문자·알림톡 (솔라피 solapi.com)
//   SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_SENDER(등록한 발신번호)
//   알림톡을 쓰려면 SOLAPI_KAKAO_PFID(카카오 채널 연결 ID) + 이벤트별 템플릿 ID
//   SOLAPI_TPL_RECEIVED · SOLAPI_TPL_APPROVED · SOLAPI_TPL_REJECTED · SOLAPI_TPL_PAID · SOLAPI_TPL_CANCELLED
//   (알림톡 실패 시 같은 내용이 문자로 대신 발송됨)
// 이메일 (Gmail 등 SMTP): SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM(선택)
// 관리자 새 신청 문자: ADMIN_NOTIFY_PHONE
import crypto from "node:crypto";
import { inArray } from "drizzle-orm";
import { db, tables } from "@/db";
import { getRequest, paymentMethodLabel } from "./requests";
import { bankAccount } from "./business";
import { hm, longDate } from "./time";
import { sendPush } from "./push";

export type NotifyEvent = "RECEIVED" | "APPROVED" | "REJECTED" | "PAID" | "CANCELLED";

const APP_URL = process.env.NEXTAUTH_URL ?? "https://deeptail-app.vercel.app";
const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export const notifyChannels = () => ({
  sms: Boolean(process.env.SOLAPI_API_KEY && process.env.SOLAPI_API_SECRET && process.env.SOLAPI_SENDER),
  kakao: Boolean(process.env.SOLAPI_KAKAO_PFID),
  email: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
  adminSms: Boolean(process.env.ADMIN_NOTIFY_PHONE),
});

type Req = NonNullable<Awaited<ReturnType<typeof getRequest>>>;

function vars(req: Req) {
  const when = req.startsAt ? `${longDate(req.startsAt)} ${hm(req.startsAt)}` : "일정 확인 중";
  const method = req.paymentMethod ? paymentMethodLabel[req.paymentMethod] : "";
  return {
    "#{이름}": req.studentName,
    "#{신청}": req.title,
    "#{일시}": when,
    "#{장소}": req.location ?? "장소 미정",
    "#{금액}": req.total > 0 ? won(req.total) : "없음",
    "#{결제방법}": method || "-",
    "#{링크}": `${APP_URL}/my/requests/${req.id}`,
  };
}

function compose(event: NotifyEvent, req: Req) {
  const v = vars(req);
  const head = `[딥테일 프리다이빙] ${v["#{이름}"]}님`;
  const body = `${v["#{신청}"]}\n${v["#{일시}"]} · ${v["#{장소}"]}`;
  const pay =
    req.total > 0 && req.paymentStatus === "UNPAID"
      ? req.paymentMethod === "BANK_TRANSFER" || !req.paymentMethod
        ? `\n결제 ${v["#{금액}"]} · 계좌이체\n${bankAccount.bank} ${bankAccount.number} (${bankAccount.holder})`
        : `\n결제 ${v["#{금액}"]} · ${v["#{결제방법}"]}`
      : "";
  const link = `\n자세히: ${v["#{링크}"]}`;
  switch (event) {
    case "RECEIVED":
      return {
        title: "신청이 접수됐어요",
        text: `${head}, 신청이 접수됐어요.\n${body}${pay}${req.status === "PENDING" ? "\n강사 확인 후 확정 알림을 드려요." : ""}${link}`,
      };
    case "APPROVED":
      return { title: "신청이 확정됐어요", text: `${head}, 신청이 확정됐어요.\n${body}${pay}${link}` };
    case "REJECTED":
      return { title: "신청이 반려됐어요", text: `${head}, 아쉽지만 신청이 반려됐어요.\n${body}\n다른 일정으로 다시 신청해 주세요.${link}` };
    case "PAID":
      return { title: "결제가 확인됐어요", text: `${head}, 결제(${v["#{금액}"]})가 확인됐어요.\n${body}${link}` };
    case "CANCELLED":
      return { title: "일정이 취소됐어요", text: `${head}, 아래 일정이 취소됐어요.\n${body}${link}` };
  }
}

// ─────────────── 솔라피 (문자 · 알림톡) ───────────────
function solapiAuth() {
  const date = new Date().toISOString().replace(/\.\d{3}Z$/, "Z"); // 초 단위 (솔라피 문서 형식)
  const salt = crypto.randomBytes(16).toString("hex");
  const signature = crypto.createHmac("sha256", process.env.SOLAPI_API_SECRET!).update(date + salt).digest("hex");
  return `HMAC-SHA256 apiKey=${process.env.SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;
}

const phoneDigits = (p: string) => p.replace(/\D/g, "");

export async function sendSolapi(messages: Record<string, unknown>[]) {
  const res = await fetch("https://api.solapi.com/messages/v4/send-many/detail", {
    method: "POST",
    headers: { Authorization: solapiAuth(), "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal: AbortSignal.timeout(8000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`솔라피 ${res.status} ${JSON.stringify(json).slice(0, 200)}`);
  const failed = (json as { failedMessageList?: { statusMessage?: string }[] }).failedMessageList ?? [];
  if (failed.length) throw new Error(`솔라피 발송 실패: ${failed.map((f) => f.statusMessage).join(", ")}`);
  return json;
}

async function smsOrKakao(event: NotifyEvent, req: Req, text: string) {
  const ch = notifyChannels();
  if (!ch.sms) return;
  const to = phoneDigits(req.studentPhone);
  const from = phoneDigits(process.env.SOLAPI_SENDER!);
  const templateId = process.env[`SOLAPI_TPL_${event}`];
  if (ch.kakao && templateId) {
    // 알림톡 (검수받은 템플릿 + 변수). 실패하면 템플릿 내용이 문자로 대신 발송됨
    await sendSolapi([{ to, from, kakaoOptions: { pfId: process.env.SOLAPI_KAKAO_PFID, templateId, variables: vars(req) } }]);
  } else {
    await sendSolapi([{ to, from, text }]); // 길이에 따라 SMS/LMS 자동
  }
}

// ─────────────── 이메일 ───────────────
async function email(to: string, subject: string, text: string) {
  if (!notifyChannels().email || !to || to.endsWith(".local")) return;
  const nodemailer = (await import("nodemailer")).default;
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: Number(process.env.SMTP_PORT ?? 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transport.sendMail({
    from: process.env.MAIL_FROM ?? `딥테일 프리다이빙 <${process.env.SMTP_USER}>`,
    to,
    subject: `[딥테일 프리다이빙] ${subject}`,
    text,
  });
}

/** 신청 상태가 바뀔 때 교육생(문자·알림톡·이메일·푸시)과 관리자(새 신청)에게 알림. 채널 하나가 실패해도 나머지는 보냄 */
export async function notifyRegistration(registrationId: string, event: NotifyEvent) {
  const req = await getRequest(registrationId);
  if (!req) return;
  const { title, text } = compose(event, req);
  const jobs: Promise<unknown>[] = [
    smsOrKakao(event, req, text),
    email(req.studentEmail, title, text),
    sendPush([req.studentId], { title, body: `${req.title} · ${req.startsAt ? longDate(req.startsAt) : ""}`, url: `/my/requests/${req.id}` }),
  ];
  if (event === "RECEIVED") {
    // 관리자: 앱 푸시(알림 켠 강사·대표) + 문자(ADMIN_NOTIFY_PHONE)
    const staff = await db.select({ id: tables.users.id }).from(tables.users).where(inArray(tables.users.role, ["ADMIN", "INSTRUCTOR"]));
    const adminText = `[딥테일 새 신청] ${req.studentName} · ${req.title}\n${vars(req)["#{일시}"]} · ${vars(req)["#{장소}"]}${
      req.total > 0 ? `\n${won(req.total)} · ${req.paymentMethod ? paymentMethodLabel[req.paymentMethod] : ""}` : ""
    }`;
    jobs.push(sendPush(staff.map((s) => s.id), { title: "새 신청", body: `${req.studentName} · ${req.title}`, url: "/admin" }));
    if (notifyChannels().sms && process.env.ADMIN_NOTIFY_PHONE) {
      jobs.push(
        sendSolapi([{ to: phoneDigits(process.env.ADMIN_NOTIFY_PHONE), from: phoneDigits(process.env.SOLAPI_SENDER!), text: adminText }]),
      );
    }
  }
  const results = await Promise.allSettled(jobs);
  for (const r of results) if (r.status === "rejected") console.error("notify", event, r.reason);
}

/** 관리자 화면 '테스트 발송' */
export async function sendTestMessage(phone: string, mail: string) {
  const out: string[] = [];
  const text = "[딥테일 프리다이빙] 알림 테스트 메시지예요. 이 문자가 보이면 설정이 끝났어요.";
  if (notifyChannels().sms && phone) {
    await sendSolapi([{ to: phoneDigits(phone), from: phoneDigits(process.env.SOLAPI_SENDER!), text }])
      .then(() => out.push("문자 발송 성공"))
      .catch((e: Error) => out.push(`문자 실패: ${e.message}`));
  }
  if (notifyChannels().email && mail) {
    await email(mail, "알림 테스트", text)
      .then(() => out.push("이메일 발송 성공"))
      .catch((e: Error) => out.push(`이메일 실패: ${e.message}`));
  }
  return out.length ? out.join(" · ") : "설정된 알림 채널이 없어요.";
}


