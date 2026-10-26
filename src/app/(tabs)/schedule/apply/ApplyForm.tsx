"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ErrorText } from "@/components/form";
import { onSiteItems, rentalFee, rentalModeForCourse, type RentalChoice, type RentalItem, type RentalMode } from "@/lib/fees";
import { SESSION_HOURS, START_TIMES } from "@/lib/time";
import { apply, type ApplyState } from "./actions";

type Course = {
  code: string;
  name: string;
  price: number;
  rentalSeparate: boolean;
  rentalFee: number | null;
  sessionCount: number | null;
};

type Variant =
  | {
      mode: "join";
      schedule: { id: string; typeLabel: string; title: string; when: string; location: string; fee: number };
      eligible: boolean;
    }
  | {
      mode: "request";
      defaultDate: string;
      minDate: string;
      locations: { id: string; name: string }[];
      enrollments: { id: string; courseCode: string; label: string }[];
      courses: Course[];
      trainings: { id: string; name: string; price: number }[];
    };

type PayMethod = "BANK_TRANSFER" | "ONSITE_CARD" | "NAVER_BOOKING";
type Bank = { bank: string; number: string; holder: string };

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

const endTime = (start: string) => {
  const [h, m] = start.split(":").map(Number);
  const mins = h * 60 + m + SESSION_HOURS * 60;
  return `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
};

export default function ApplyForm({
  variant,
  rentalItems,
  bank,
  naverBookingUrl,
}: {
  variant: Variant;
  rentalItems: RentalItem[];
  bank: Bank;
  naverBookingUrl?: string | null;
}) {
  const [payMethod, setPayMethod] = useState<PayMethod>("BANK_TRANSFER");
  const [state, action] = useFormState<ApplyState, FormData>(apply, {});

  // 신청 내용
  const req = variant.mode === "request" ? variant : null;
  const [kind, setKind] = useState<"REGULAR_CLASS" | "PAID_TRAINING">("REGULAR_CLASS");
  const [enrollmentId, setEnrollmentId] = useState(req?.enrollments[0]?.id ?? "new");
  const [courseCode, setCourseCode] = useState(req?.courses[0]?.code ?? "");
  const [trainingId, setTrainingId] = useState(req?.trainings[0]?.id ?? "");
  const [startTime, setStartTime] = useState("10:00");

  // 장비대여
  const [choice, setChoice] = useState<RentalChoice>({});
  const [packagePicked, setPackagePicked] = useState(false);

  const { lessonFee, lessonNote, mode } = useMemo((): { lessonFee: number; lessonNote: string; mode: RentalMode } => {
    if (variant.mode === "join") {
      return { lessonFee: variant.schedule.fee, lessonNote: variant.schedule.fee ? "참가비" : "참가비 없음", mode: { kind: "items" } };
    }
    if (kind === "PAID_TRAINING") {
      const t = variant.trainings.find((x) => x.id === trainingId);
      return { lessonFee: t?.price ?? 0, lessonNote: t ? `${t.name} (1인)` : "", mode: { kind: "items" } };
    }
    if (enrollmentId !== "new") {
      const e = variant.enrollments.find((x) => x.id === enrollmentId);
      const c = variant.courses.find((x) => x.code === e?.courseCode);
      return {
        lessonFee: 0,
        lessonNote: "등록한 과정에서 1회 차감",
        mode: c ? rentalModeForCourse(c) : { kind: "free" },
      };
    }
    const c = variant.courses.find((x) => x.code === courseCode);
    return {
      lessonFee: c?.price ?? 0,
      lessonNote: c ? `${c.name} 과정 등록${c.sessionCount ? ` (${c.sessionCount}회)` : ""}` : "",
      mode: c ? rentalModeForCourse(c) : { kind: "free" },
    };
  }, [variant, kind, enrollmentId, courseCode, trainingId]);

  const rental = rentalFee(mode, rentalItems, choice, packagePicked);
  const onSite = onSiteItems(mode, rentalItems, choice);
  const total = lessonFee + rental;
  const anyRental = packagePicked || Object.values(choice).some(Boolean);
  const blocked = variant.mode === "join" && !variant.eligible;

  return (
    <form action={action} className="flex flex-col gap-4 p-4 pb-36">
      <input type="hidden" name="mode" value={variant.mode} />

      {variant.mode === "join" ? (
        <>
          <input type="hidden" name="scheduleId" value={variant.schedule.id} />
          <Card title="신청할 일정">
            <span className="self-start rounded-md bg-brand-tint px-2 py-0.5 text-[11px] font-bold text-brand-mid">
              {variant.schedule.typeLabel}
            </span>
            <p className="text-[15px] font-bold">{variant.schedule.title}</p>
            <p className="text-sm text-ink-sub">
              {variant.schedule.when} · {variant.schedule.location}
            </p>
          </Card>
          {blocked && (
            <p className="rounded-xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
              자율연습반 · 정기트레이닝은 <b>레벨 2 이상 자격</b>이 있거나, <b>AIDA 2 · AIDA 3 수강생</b>이{" "}
              <b>2회차 강습 이후</b>부터 참여할 수 있어요.
              <a href="/my" className="mt-1 block font-bold underline">
                자격증이 있다면 마이페이지에서 등록하기
              </a>
            </p>
          )}
        </>
      ) : (
        <>
          {/* 1. 신청 과정 */}
          <Card title="신청 과정">
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="신청 과정">
              <Choice name="kind" value="REGULAR_CLASS" checked={kind === "REGULAR_CLASS"} onChange={() => setKind("REGULAR_CLASS")}>
                정규수업
              </Choice>
              <Choice name="kind" value="PAID_TRAINING" checked={kind === "PAID_TRAINING"} onChange={() => setKind("PAID_TRAINING")}>
                유료트레이닝
              </Choice>
            </div>

            {kind === "REGULAR_CLASS" ? (
              <div className="flex flex-col gap-2">
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">수강권</span>
                  <Select name="enrollmentId" value={enrollmentId} onChange={setEnrollmentId}>
                    {variant.enrollments.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.label}
                      </option>
                    ))}
                    <option value="new">새 과정 등록하기</option>
                  </Select>
                </label>
                {enrollmentId === "new" && (
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium">등록할 과정</span>
                    <Select name="courseCode" value={courseCode} onChange={setCourseCode}>
                      {variant.courses.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name} · {won(c.price)}
                        </option>
                      ))}
                    </Select>
                  </label>
                )}
                <p className="text-xs text-ink-mute">정규수업은 담당강사가 승인하면 확정돼요.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {variant.trainings.map((t) => (
                  <Choice
                    key={t.id}
                    name="trainingOptionId"
                    value={t.id}
                    checked={trainingId === t.id}
                    onChange={() => setTrainingId(t.id)}
                  >
                    <span className="flex flex-col">
                      <span>{t.name.replace(" 트레이닝", "")}</span>
                      <span className="text-xs font-medium opacity-80">{won(t.price)}</span>
                    </span>
                  </Choice>
                ))}
              </div>
            )}
          </Card>

          {/* 2. 장소 · 날짜 · 시간 */}
          <Card title="장소 · 날짜 · 시간">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">장소</span>
              <select
                name="locationId"
                required
                defaultValue=""
                className="h-12 rounded-xl border border-line bg-white px-3 text-base"
              >
                <option value="" disabled>
                  장소를 선택하세요
                </option>
                {variant.locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">날짜</span>
                <input
                  type="date"
                  name="date"
                  required
                  min={variant.minDate}
                  defaultValue={variant.defaultDate}
                  className="h-12 rounded-xl border border-line bg-white px-3 text-base"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">시작 시간</span>
                <Select name="startTime" value={startTime} onChange={setStartTime}>
                  {START_TIMES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
            <p className="text-xs text-ink-mute">
              {startTime} ~ {endTime(startTime)} (약 {SESSION_HOURS}시간) · 다른 수업과 겹치면 신청할 수 없어요.
            </p>
          </Card>
        </>
      )}

      {/* 장비대여 */}
      {!blocked && (
        <Card title="장비대여">
          {mode.kind === "free" && (
            <p className="rounded-lg bg-brand-tint px-3 py-2 text-sm font-medium text-brand-mid">
              이 과정은 장비대여료가 무료예요. 필요한 장비를 체크해 주세요.
            </p>
          )}
          {mode.kind === "package" ? (
            <Check name="rentPackage" checked={packagePicked} onChange={setPackagePicked}>
              <span className="flex flex-1 justify-between">
                <span>
                  장비 일체 대여
                  <span className="block text-xs text-ink-mute">마스크 스노클, 롱핀, 슈트, 웨이트</span>
                </span>
                <b>{won(mode.fee)}</b>
              </span>
            </Check>
          ) : (
            rentalItems.map((it) => (
              <Check
                key={it.code}
                name={`rent_${it.code}`}
                checked={!!choice[it.code as keyof RentalChoice]}
                onChange={(v) => setChoice((c) => ({ ...c, [it.code]: v }))}
              >
                <span className="flex flex-1 justify-between">
                  <span>{it.name}</span>
                  <span className={it.payOnSite ? "text-ink-mute" : "font-bold"}>
                    {mode.kind === "free" ? "무료" : it.payOnSite || it.price == null ? "현장결제" : won(it.price)}
                  </span>
                </span>
              </Check>
            ))
          )}
          {anyRental && (
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">발 사이즈 (mm)</span>
                <input name="finSize" inputMode="numeric" placeholder="예) 260" className="h-12 rounded-xl border border-line px-3 text-base" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">체중 (kg)</span>
                <input name="weightKg" inputMode="numeric" placeholder="웨이트 산정용" className="h-12 rounded-xl border border-line px-3 text-base" />
              </label>
            </div>
          )}
        </Card>
      )}

      {/* 교육비 · 결제 안내 */}
      {!blocked && (
        <Card title="교육비 안내">
          <dl className="flex flex-col gap-2 text-sm">
            <Row label={variant.mode === "join" ? "참가비" : "교육비"} note={lessonNote} value={won(lessonFee)} />
            <Row label="장비대여료" value={won(rental)} />
            {onSite.length > 0 && <Row label="현장결제" value={onSite.map((i) => i.name).join(", ")} muted />}
            <div className="mt-1 flex items-center justify-between border-t border-line pt-3">
              <dt className="font-bold">결제하실 금액</dt>
              <dd className="text-xl font-extrabold text-brand-mid">{won(total)}</dd>
            </div>
          </dl>
          {total > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-bold">결제 방법</p>
              <input type="hidden" name="paymentMethod" value={payMethod} />
              <div role="radiogroup" aria-label="결제 방법" className="grid grid-cols-1 gap-2">
                {(
                  [
                    { v: "BANK_TRANSFER" as PayMethod, label: "계좌이체", sub: "신청 후 계좌로 입금" },
                    { v: "ONSITE_CARD" as PayMethod, label: "현장 카드결제", sub: "수업 당일 강사에게 카드로 결제" },
                    ...(naverBookingUrl
                      ? [{ v: "NAVER_BOOKING" as PayMethod, label: "네이버 예약 · 카드/네이버페이", sub: "네이버 예약 페이지에서 결제" }]
                      : []),
                  ]
                ).map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    role="radio"
                    aria-checked={payMethod === o.v}
                    onClick={() => setPayMethod(o.v)}
                    className={`flex flex-col items-start rounded-xl border px-4 py-3 text-left ${
                      payMethod === o.v ? "border-brand bg-brand-tint" : "border-line bg-white"
                    }`}
                  >
                    <span className="text-sm font-bold">{o.label}</span>
                    <span className="text-xs text-ink-sub">{o.sub}</span>
                  </button>
                ))}
              </div>

              {payMethod === "BANK_TRANSFER" && (
                <div className="flex flex-col gap-2 rounded-xl bg-canvas p-3 text-sm">
                  <p>
                    {bank.bank} <b>{bank.number}</b>
                    <br />
                    예금주 {bank.holder}
                  </p>
                  <CopyButton text={bank.number} />
                  <p className="text-xs text-ink-mute">신청 후 입금해 주세요. 입금이 확인되면 &lsquo;결제완료&rsquo;로 바뀌어요.</p>
                </div>
              )}
              {payMethod === "ONSITE_CARD" && (
                <p className="rounded-xl bg-canvas p-3 text-xs text-ink-sub">
                  수업 당일 강사에게 카드로 결제해 주세요. 결제가 끝나면 &lsquo;결제완료&rsquo;로 바뀌어요.
                </p>
              )}
              {payMethod === "NAVER_BOOKING" && naverBookingUrl && (
                <div className="flex flex-col gap-2 rounded-xl bg-canvas p-3 text-xs text-ink-sub">
                  <p>
                    먼저 이 앱에서 신청을 마친 뒤, 네이버 예약에서 <b>같은 날짜·같은 금액</b>으로 결제해 주세요. 예약자 이름은 앱
                    가입 이름과 같게 적어 주세요.
                  </p>
                  <a
                    href={naverBookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-10 items-center justify-center rounded-lg bg-[#03C75A] text-sm font-bold text-white"
                  >
                    네이버 예약 페이지 열기 ↗
                  </a>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-ink-mute">결제하실 금액이 없어요.</p>
          )}
        </Card>
      )}

      {!blocked && (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">요청 사항 (선택)</span>
          <textarea
            name="memo"
            maxLength={200}
            rows={2}
            placeholder="강사에게 전할 말이 있으면 적어 주세요"
            className="rounded-xl border border-line bg-white p-3 text-base"
          />
        </label>
      )}

      <ErrorText>{state.error}</ErrorText>

      {!blocked && (
        <div className="fixed inset-x-0 bottom-[calc(58px+max(env(safe-area-inset-bottom),12px))] z-10 mx-auto max-w-[480px] px-4 pb-3">
          <Submit total={total} />
        </div>
      )}
    </form>
  );
}

function Submit({ total }: { total: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-14 w-full items-center justify-center rounded-xl bg-brand text-base font-bold text-white shadow-card disabled:opacity-60"
    >
      {pending ? "신청 중…" : total > 0 ? `${won(total)} · 신청하기` : "신청하기"}
    </button>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card">
      <h2 className="text-sm font-bold text-brand">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value, note, muted }: { label: string; value: string; note?: string; muted?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-ink-sub">
        {label}
        {note && <span className="block text-xs text-ink-mute">{note}</span>}
      </dt>
      <dd className={muted ? "text-right text-ink-mute" : "font-bold"}>{value}</dd>
    </div>
  );
}

function Choice({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl border px-3 py-2 text-center text-sm font-bold transition ${
        checked ? "border-brand bg-brand text-white" : "border-line bg-white text-ink"
      }`}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      {children}
    </label>
  );
}

function Check({
  name,
  checked,
  onChange,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-line px-3 py-2 text-sm">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-brand"
      />
      {children}
    </label>
  );
}

function Select({
  name,
  value,
  onChange,
  children,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-12 rounded-xl border border-line bg-white px-3 text-base"
    >
      {children}
    </select>
  );
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          /* 복사 실패 시 무시 — 계좌번호는 화면에 그대로 보임 */
        }
      }}
      className="min-h-11 self-start rounded-lg border border-brand px-4 text-sm font-bold text-brand"
    >
      {done ? "복사됐어요" : "계좌번호 복사"}
    </button>
  );
}
