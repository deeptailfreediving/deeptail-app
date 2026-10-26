// 프리다이빙 자격 레벨: 회원이 자격증 사진과 레벨을 올리면 → 관리자가 확인 후 승인 → 이름 옆에 레벨 숫자 표시
import { and, desc, eq } from "drizzle-orm";
import { db, tables } from "@/db";
import { saveUpload } from "./uploads";

export const AGENCIES = ["AIDA", "PADI", "SSI", "CMAS", "Molchanovs", "기타"] as const;
export const LEVELS = [1, 2, 3, 4] as const;

const { licenseRequests: lr, users } = tables;

export type LicenseInput = { agency?: string; level?: string | number; image?: string };

/** 입력값이 비었으면 null, 이상하면 에러 문구 */
export function parseLicense(v: LicenseInput): { agency: string; level: number; image?: string } | string | null {
  const agency = (v.agency ?? "").trim();
  if (!agency) return null;
  if (!AGENCIES.includes(agency as (typeof AGENCIES)[number])) return "자격 단체를 다시 골라 주세요.";
  const level = Number(v.level);
  if (!LEVELS.includes(level as 1 | 2 | 3 | 4)) return "자격 레벨을 골라 주세요.";
  if (!v.image) return "자격증 사진을 올려 주세요. (카드·수료증·앱 화면 캡처 모두 괜찮아요)";
  return { agency, level, image: v.image };
}

/** 승인 요청 만들기 (이전에 기다리던 요청은 취소) */
export async function requestLicense(userId: string, input: { agency: string; level: number; image?: string }) {
  const imageId = await saveUpload("LICENSE", input.image, userId);
  if (input.image && !imageId) return "사진을 올리지 못했어요. 다른 사진으로 다시 시도해 주세요.";
  await db
    .update(lr)
    .set({ status: "REJECTED", note: "새 요청으로 대체" })
    .where(and(eq(lr.userId, userId), eq(lr.status, "PENDING")));
  await db.insert(lr).values({ userId, agency: input.agency, level: input.level, imageId });
  return null;
}

export async function latestLicenseRequest(userId: string) {
  const [row] = await db.select().from(lr).where(eq(lr.userId, userId)).orderBy(desc(lr.createdAt)).limit(1);
  return row ?? null;
}

export async function listPendingLicenseRequests() {
  return db
    .select({
      id: lr.id,
      agency: lr.agency,
      level: lr.level,
      imageId: lr.imageId,
      createdAt: lr.createdAt,
      userId: users.id,
      name: users.name,
      phone: users.phone,
      currentLevel: users.licenseLevel,
    })
    .from(lr)
    .innerJoin(users, eq(lr.userId, users.id))
    .where(eq(lr.status, "PENDING"))
    .orderBy(lr.createdAt);
}
