import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, tables } from "@/db";
import { getSetting } from "@/lib/settings";
import PageHeader from "@/components/PageHeader";
import { getSession } from "@/lib/auth";
import { bankAccount } from "@/lib/business";
import { listCourses, listRentalItems, listTrainingOptions } from "@/lib/pricing";
import { getSchedule, listMyEnrollments, practiceEligible, scheduleTypeLabel } from "@/lib/schedule";
import { hm, isYmd, longDate, todayYmd } from "@/lib/time";
import ApplyForm from "./ApplyForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "수업 신청 | 딥테일 프리다이빙" };

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: { join?: string; date?: string };
}) {
  // 미들웨어가 로그인을 보장함
  const session = (await getSession())!;
  const naverBookingUrl = await getSetting("naver_booking_url");
  const [rentals, courses, trainings, locations, enrollments] = await Promise.all([
    listRentalItems(),
    listCourses(),
    listTrainingOptions(),
    db.select().from(tables.locations).where(eq(tables.locations.isActive, true)).orderBy(asc(tables.locations.sortOrder)),
    listMyEnrollments(session.user.id),
  ]);

  const rentalItems = rentals.map(({ code, name, price, payOnSite }) => ({ code, name, price, payOnSite }));

  if (searchParams.join) {
    const s = await getSchedule(searchParams.join);
    if (!s) notFound();
    const needsEligibility =
      s.type === "SELF_PRACTICE" || s.type === "REGULAR_TRAINING" || (s.type === "PAID_TRAINING" && s.location === "딥스테이션");
    const eligible = needsEligibility ? await practiceEligible(session.user.id) : true;
    return (
      <>
        <PageHeader title="참여 신청" back={`/schedule`} />
        <ApplyForm
          variant={{
            mode: "join",
            schedule: {
              id: s.id,
              typeLabel: scheduleTypeLabel[s.type],
              title: s.title,
              when: `${longDate(s.startsAt)} ${hm(s.startsAt)} ~ ${hm(s.endsAt)}`,
              location: s.location ?? "장소 미정",
              fee: s.fee ?? 0,
            },
            eligible,
          }}
          rentalItems={rentalItems}
          bank={bankAccount}
          naverBookingUrl={naverBookingUrl}
        />
      </>
    );
  }

  const date = isYmd(searchParams.date) && searchParams.date >= todayYmd() ? searchParams.date : todayYmd();

  return (
    <>
      <PageHeader title="수업 신청" back={`/schedule?date=${date}`} />
      <ApplyForm
        variant={{
          mode: "request",
          defaultDate: date,
          minDate: todayYmd(),
          locations: locations.map((l) => ({ id: l.id, name: l.name })),
          enrollments: enrollments
            .filter((e) => e.available > 0)
            .map((e) => ({ id: e.id, courseCode: e.course.code, label: `${e.course.name} · 남은 ${e.available}회` })),
          courses: courses
            .filter((c) => c.price != null)
            .map((c) => ({
              code: c.code,
              name: c.name,
              price: c.price!,
              rentalSeparate: c.rentalSeparate,
              rentalFee: c.rentalFee,
              sessionCount: c.sessionCount,
            })),
          trainings: trainings.map((t) => ({ id: t.id, name: t.name, price: t.price })),
        }}
        rentalItems={rentalItems}
        bank={bankAccount}
        naverBookingUrl={naverBookingUrl}
      />
    </>
  );
}
