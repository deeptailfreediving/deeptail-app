// 웹 푸시 알림 (홈 화면에 추가한 앱 · 브라우저)
// 필요 환경변수: NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT(mailto:대표 이메일)
import webpush from "web-push";
import { eq, inArray } from "drizzle-orm";
import { db, tables } from "@/db";

export const pushEnabled = () =>
  Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

let configured = false;
function configure() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:admin@deeptail.local",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
}

export type PushPayload = { title: string; body: string; url: string; tag?: string };

/** 여러 회원에게 알림. 만료된 구독은 정리. 보낸 기기 수를 돌려줌 */
export async function sendPush(userIds: string[], payload: PushPayload): Promise<number> {
  if (!pushEnabled() || userIds.length === 0) return 0;
  configure();
  const subs = await db
    .select()
    .from(tables.pushSubscriptions)
    .where(inArray(tables.pushSubscriptions.userId, userIds));

  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24 },
        );
        sent++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        // 404·410 = 기기에서 알림을 끄거나 앱을 지움 → 구독 삭제
        if (status === 404 || status === 410) {
          await db.delete(tables.pushSubscriptions).where(eq(tables.pushSubscriptions.id, s.id));
        } else {
          console.error("push failed", status, (e as Error).message);
        }
      }
    }),
  );
  return sent;
}
