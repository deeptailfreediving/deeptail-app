// 자율연습반 · 정기트레이닝 참여 자격
// 안내문 기준: AIDA 2 / AIDA 3 수강생 중 n회차(2회차) 강습을 마친 사람
type EnrollmentLike = { usedSessions: number; course: { practiceFromSession: number | null } };

export function canJoinPractice(enrollments: EnrollmentLike[]) {
  return enrollments.some(
    (e) => e.course.practiceFromSession != null && e.usedSessions >= e.course.practiceFromSession,
  );
}
