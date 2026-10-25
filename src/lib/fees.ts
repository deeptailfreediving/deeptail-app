// 신청 금액 계산 (화면 미리보기와 서버 저장에서 같은 규칙을 씀 — DB 접근 없음)

export type RentalItem = { code: string; name: string; price: number | null; payOnSite: boolean };
export type RentalChoice = Partial<Record<"MASK_SNORKEL" | "LONG_FIN" | "WEIGHT" | "SUIT", boolean>>;

/**
 * 장비대여 방식
 * - free: AIDA 정규과정 (장비대여료 무료)
 * - package: 체험 (묶음 대여료, 예: 20,000원)
 * - items: 유료트레이닝 · 자율연습 · 정기트레이닝 · 투어 (품목별, 슈트는 현장결제)
 */
export type RentalMode = { kind: "free" } | { kind: "package"; fee: number } | { kind: "items" };

export function rentalModeForCourse(course: { rentalSeparate: boolean; rentalFee: number | null }): RentalMode {
  if (course.rentalSeparate && course.rentalFee != null) return { kind: "package", fee: course.rentalFee };
  if (course.rentalSeparate) return { kind: "items" };
  return { kind: "free" };
}

export function rentalFee(mode: RentalMode, items: RentalItem[], choice: RentalChoice, packagePicked: boolean) {
  if (mode.kind === "free") return 0;
  if (mode.kind === "package") return packagePicked ? mode.fee : 0;
  return items.reduce((sum, it) => {
    const picked = choice[it.code as keyof RentalChoice];
    return picked && !it.payOnSite && it.price ? sum + it.price : sum;
  }, 0);
}

export const onSiteItems = (mode: RentalMode, items: RentalItem[], choice: RentalChoice) =>
  mode.kind === "items" ? items.filter((it) => it.payOnSite && choice[it.code as keyof RentalChoice]) : [];
