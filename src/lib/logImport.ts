import { z } from "zod";

// 가져오기 파일 형식 (노션 로그북에서 변환한 JSON)
// { "source": "notion", "records": [ { diveDate, purpose, place, ... }, ... ] }

const text = z.string().max(5000).optional().default("");
const num = z.number().min(0).max(1000).nullable().optional().default(null);

export const importRecord = z.object({
  diveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  purpose: z.enum(["SELF_PRACTICE", "REGULAR_TRAINING", "REGULAR_CLASS", "PAID_TRAINING", "PERSONAL_TRAINING", "FUN_DIVING"]),
  place: z.string().min(1).max(60),
  suit: text,
  weight: text,
  activity: text,
  staSec: num,
  staNote: text,
  dynM: num,
  dynNote: text,
  fimM: num,
  fimNote: text,
  cwtM: num,
  cwtNote: text,
  feedback: text,
  reviewed: z.boolean().optional().default(false),
});

export const importFile = z.object({
  source: z.string().optional(),
  records: z.array(importRecord).min(1).max(1000),
});

export type ImportRecord = z.infer<typeof importRecord>;
