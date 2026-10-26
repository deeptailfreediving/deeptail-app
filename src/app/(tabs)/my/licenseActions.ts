"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { parseLicense, requestLicense } from "@/lib/license";

export type LicenseState = { error?: string; ok?: boolean };

export async function submitLicense(_: LicenseState, formData: FormData): Promise<LicenseState> {
  const session = await getSession();
  if (!session) return { error: "로그인이 필요해요." };
  const license = parseLicense({
    agency: String(formData.get("licenseAgency") ?? ""),
    level: String(formData.get("licenseLevel") ?? ""),
    image: String(formData.get("licenseImage") ?? ""),
  });
  if (license === null) return { error: "자격 단체를 골라 주세요." };
  if (typeof license === "string") return { error: license };
  const err = await requestLicense(session.user.id, license);
  if (err) return { error: err };
  revalidatePath("/my");
  return { ok: true };
}
