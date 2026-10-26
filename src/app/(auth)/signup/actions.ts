"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, tables } from "@/db";
import { parseLicense, requestLicense } from "@/lib/license";

const schema = z
  .object({
    name: z.string().trim().min(1, "이름을 입력해 주세요."),
    email: z.string().trim().toLowerCase().email("이메일 형식이 맞지 않아요."),
    phone: z
      .string()
      .trim()
      .regex(/^01[0-9]-?\d{3,4}-?\d{4}$/, "휴대폰 번호를 확인해 주세요."),
    birthDate: z.coerce.date({ message: "생년월일을 입력해 주세요." }),
    password: z.string().min(8, "비밀번호는 8자 이상이어야 해요."),
    passwordConfirm: z.string(),
    agreePrivacy: z.literal("on", { message: "개인정보 수집·이용에 동의해 주세요." }),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    message: "비밀번호가 서로 달라요.",
    path: ["passwordConfirm"],
  });

export type SignupState = { error?: string };

function ageOn(birth: Date, today = new Date()) {
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export async function signup(_: SignupState, formData: FormData): Promise<SignupState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  const license = parseLicense({
    agency: String(formData.get("licenseAgency") ?? ""),
    level: String(formData.get("licenseLevel") ?? ""),
    image: String(formData.get("licenseImage") ?? ""),
  });
  if (typeof license === "string") return { error: license };

  // 만 14세 미만은 보호자 동의 절차가 필요 — 절차 확정 전까지 앱 가입을 막고 안내
  if (ageOn(v.birthDate) < 14) {
    return { error: "만 14세 미만은 보호자 동의가 필요해요. 딥테일로 직접 문의해 주세요." };
  }

  const [exists] = await db
    .select({ id: tables.users.id })
    .from(tables.users)
    .where(eq(tables.users.email, v.email));
  if (exists) return { error: "이미 가입된 이메일이에요." };

  const [user] = await db.insert(tables.users).values({
    name: v.name,
    email: v.email,
    phone: v.phone.replace(/-/g, "").replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3"),
    birthDate: v.birthDate,
    passwordHash: await bcrypt.hash(v.password, 10),
  }).returning({ id: tables.users.id });

  // 자격증을 올렸으면 승인 요청 (관리자 확인 후 이름 옆 레벨 표시)
  if (license) await requestLicense(user.id, license);

  redirect("/login?joined=1");
}
