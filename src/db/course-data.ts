// 딥테일프리다이빙 교육과정 안내문 기준 데이터
// AIDA 4는 안내문이 없어 교육비만 입력 (나머지는 확정 후 추가)

const AIDA_BENEFITS = ["장비대여료 · 자격증 발급비 무료", "강사 1:1 프라이빗 교육", "개인 전자 로그북 제공"];

export type CourseSeed = {
  code: string;
  name: string;
  levelLabel?: string;
  summary?: string;
  sessionCount?: number | null;
  price: number;
  rentalSeparate?: boolean;
  rentalFee?: number | null;
  rentalItemsNote?: string;
  benefits?: string[];
  goals?: string[];
  audience?: string[];
  companionDiscount?: number | null;
  validityMonths?: number | null;
  practiceFromSession?: number | null;
  upgradeNote?: string;
  sessions?: { items: string[]; detail?: string }[];
};

export const courseData: CourseSeed[] = [
  {
    code: "TRIAL",
    name: "프리다이빙 체험",
    levelLabel: "체험",
    summary: "프리다이빙 종목을 간접 체험해 보는 과정입니다.",
    sessionCount: 1,
    price: 50_000,
    rentalSeparate: true,
    rentalFee: 20_000,
    rentalItemsNote: "마스크 스노클, 롱핀, 슈트, 웨이트",
    goals: ["프리다이빙 종목 간접 체험"],
    audience: ["프리다이빙이 무엇인지 궁금하신 분"],
    sessions: [{ items: ["5m 풀장 교육 1회 (약 3시간)"] }],
  },
  {
    code: "AIDA1",
    name: "AIDA 1",
    levelLabel: "입문",
    summary: "물과 친해지고 기본 잠영과 수심에 적응하는 입문 과정입니다.",
    sessionCount: 1,
    price: 150_000,
    benefits: AIDA_BENEFITS,
    goals: ["물 공포증 극복", "물과 친해지기", "기본 잠영 및 수심 적응"],
    audience: ["물이 무서운 분", "프리다이빙을 처음 접하는 분"],
    upgradeNote:
      "AIDA 1 수료 후 AIDA 2 과정으로 연계 시 기존 교육 횟수 1회 차감, 추가 비용 300,000원만 납부하면 AIDA 2 과정으로 업그레이드 가능",
    sessions: [{ items: ["이론 교육 (약 3시간)", "5m 풀장 교육 1회 (약 3시간)"] }],
  },
  {
    code: "AIDA2",
    name: "AIDA 2",
    levelLabel: "레벨 2",
    summary: "2회차 이후 자율연습반·정기트레이닝에 참여할 수 있어요.",
    sessionCount: 4,
    price: 450_000,
    benefits: AIDA_BENEFITS,
    companionDiscount: 50_000,
    validityMonths: 12,
    practiceFromSession: 2,
    sessions: [
      { items: ["이론 교육 (2~3시간)", "5m 풀장 교육 (3시간)"] },
      { items: ["5m 풀장 교육 (3시간)"], detail: "2회차 이후부터 자율 연습반 및 정기 트레이닝 참여 가능" },
      { items: ["5m 풀장 교육 (3시간)"] },
      { items: ["딥스테이션 수심 교육"] },
    ],
  },
  {
    code: "AIDA3",
    name: "AIDA 3",
    levelLabel: "레벨 3",
    summary: "딥스테이션 수심 교육 중심의 심화 과정입니다.",
    sessionCount: 4,
    price: 600_000,
    benefits: AIDA_BENEFITS,
    companionDiscount: 50_000,
    validityMonths: 12,
    practiceFromSession: 2,
    sessions: [
      { items: ["이론 교육 (2~3시간)", "5m 풀장 교육 (3시간)"], detail: "스테틱, 다이나믹, 렁스트레칭" },
      { items: ["딥스테이션 수심 교육"], detail: "중성부력, 셀프 레스큐, 수심" },
      { items: ["딥스테이션 수심 교육"], detail: "세이프티 다이빙, 레스큐, 수심" },
      { items: ["딥스테이션 수심 교육"] },
    ],
  },
  {
    code: "AIDA4",
    name: "AIDA 4",
    levelLabel: "레벨 4",
    sessionCount: null,
    price: 800_000,
  },
];

// 자율연습반 · 정기트레이닝 안내
export const practiceInfo = {
  intro: "강습 이후에도 꾸준히 연습할 수 있도록 두 가지 방식으로 운영합니다.",
  selfPractice: { name: "자율 연습반", badge: "상시 진행", desc: "강습 일정에 맞춰 입장 후 자유롭게 개인 연습을 진행합니다." },
  regularTraining: {
    name: "정기 트레이닝",
    badge: "주 1회",
    desc: "강사가 직접 참석 인원을 확인하고, 연습 방향을 제시하며, 개인 피드백을 제공합니다.",
  },
  target: "AIDA 2 / AIDA 3 수강생 · 2회차 강습 이후 참여 가능",
  cost: "별도의 추가 비용 없음 · 단, 개인적으로 필요한 장비가 있을 경우 대여료 발생",
};

export const brand = {
  slogan: "디테일이 깊이를 만듭니다",
  intro:
    "딥테일프리다이빙은 강사 1:1 프라이빗 교육으로 교육생 한 분 한 분에게 맞춘 디테일한 교육을 진행합니다. 꾸준한 소통과 개별 관리, 함께 성장하는 커뮤니티까지 끝까지 책임지겠습니다.",
  keywords: "1:1 · 프리미엄 · 프라이빗 · 소통 · 맞춤형 교육",
};
