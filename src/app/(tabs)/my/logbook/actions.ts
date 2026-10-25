"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, tables } from "@/db";
import { getSession } from "@/lib/auth";
import { todayYmd } from "@/lib/time";

export type LogState = { error?: string };

const num = (max: number) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .refine((v) => v === undefined || (Number.isFinite(v) && v >= 0 && v <= max), "기록 숫자를 확인해 주세요.");

const note = z.string().trim().max(2000).optional().default("");

const schema = z.object({
  diveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "다이빙 날짜를 선택해 주세요."),
  purpose: z.enum(["SELF_PRACTICE", "REGULAR_TRAINING", "REGULAR_CLASS", "PAID_TRAINING", "PERSONAL_TRAINING", "FUN_DIVING"], {
    message: "다이빙 목적을 선택해 주세요.",
  }),
  place: z.string().trim().min(1, "장소를 선택해 주세요.").max(60),
  suit: z.string().trim().max(40).optional().default(""),
  weight: z.string().trim().max(20).optional().default(""),
  activity: note,
  staMin: num(15),
  staSec: num(59),
  staNote: note,
  dynM: num(300),
  dynNote: note,
  fimM: num(150),
  fimNote: note,
  cwtM: num(150),
  cwtNote: note,
});

const positive = (v?: number) => (v && v > 0 ? v : null);

export async function saveLog(id: string | null, _: LogState, formData: FormData): Promise<LogState> {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/my/logbook");

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  if (v.diveDate > todayYmd()) return { error: "오늘 이후 날짜는 기록할 수 없어요." };

  const staTotal = (v.staMin ?? 0) * 60 + (v.staSec ?? 0);
  const values = {
    diveDate: v.diveDate,
    purpose: v.purpose,
    place: v.place,
    suit: v.suit,
    weight: v.weight,
    activity: v.activity,
    staSec: positive(staTotal),
    staNote: v.staNote,
    dynM: positive(v.dynM),
    dynNote: v.dynNote,
    fimM: positive(v.fimM),
    fimNote: v.fimNote,
    cwtM: positive(v.cwtM),
    cwtNote: v.cwtNote,
  };

  if (id) {
    const res = await db
      .update(tables.diveLogs)
      .set(values)
      .where(and(eq(tables.diveLogs.id, id), eq(tables.diveLogs.userId, session.user.id)))
      .returning({ id: tables.diveLogs.id });
    if (!res.length) return { error: "기록을 찾을 수 없어요." };
  } else {
    await db.insert(tables.diveLogs).values({ ...values, userId: session.user.id });
  }
  revalidatePath("/my", "layout");
  redirect("/my/logbook?saved=1");
}

export async function deleteLog(id: string) {
  const session = await getSession();
  if (!session) redirect("/login");
  await db
    .delete(tables.diveLogs)
    .where(and(eq(tables.diveLogs.id, id), eq(tables.diveLogs.userId, session.user.id)));
  revalidatePath("/my", "layout");
  redirect("/my/logbook");
}
