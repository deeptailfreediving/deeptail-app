import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { Block, Bullets, Hook, KeyPoints, Note, Steps } from "@/components/Article";

export const metadata = { title: "풀장 이용 안내 | 딥테일 프리다이빙" };

// 풀장 이용 안내 — 입장료는 '딥테일 프리다이빙 강습 안내'(노션) 기준. 바뀌면 여기만 고치면 됨
const pools = [
  {
    name: "수원월드컵경기장",
    short: "수원풀",
    depth: "5m 풀장",
    fee: "18,000원",
    for: "체험 · AIDA 1~2 · 자율연습반 · 정기트레이닝",
    tips: [],
  },
  {
    name: "성남 아쿠아라인",
    short: "성남풀",
    depth: "5m 풀장",
    fee: "평일 15,000원 · 주말 20,000원",
    for: "체험 · AIDA 1~2 · 자율연습반 · 정기트레이닝",
    tips: [],
  },
  {
    name: "딥스테이션",
    short: "딥스",
    depth: "깊은 수심 풀장",
    fee: "평일 48,000원 · 주말 66,000원",
    for: "AIDA 2~4 수심 교육 · 유료트레이닝",
    tips: ["레벨 2 이상만 입장할 수 있어요."],
  },
];

const mapUrl = (q: string) => `https://map.naver.com/p/search/${encodeURIComponent(q)}`;

export default function PoolsPage() {
  return (
    <>
      <PageHeader title="풀장 이용 안내" back="/" />

      <Hook question="처음 가는 풀장, 무엇을 챙기고 언제 가야 할까요?">
        <p>
          입장료는 교육비와 <b className="text-white">따로</b> 현장에서 내요. 시작 <b className="text-white">20분 전</b>에
          도착하면 여유 있게 준비할 수 있어요.
        </p>
      </Hook>

      <KeyPoints
        items={[
          <>
            <b>입장료는 현장 결제.</b> 교육비·트레이닝비에 풀장 입장료는 들어 있지 않아요.
          </>,
          <>
            <b>수영복 · 수모 · 세면도구 · 수건</b>을 챙겨요. 장비 대여는 신청할 때 미리 체크해요.
          </>,
          <>
            <b>시작 20분 전 도착.</b> 입장 → 탈의·샤워 → 풀장에서 강사와 만나요.
          </>,
        ]}
      />

      <Block title="풀장별 입장료">
        <ul className="flex flex-col gap-2">
          {pools.map((p) => (
            <li key={p.name} className="flex flex-col gap-1.5 rounded-xl border border-line p-3.5 text-sm">
              <span className="flex items-center justify-between gap-2">
                <b className="text-[15px]">
                  {p.name} <span className="text-xs font-medium text-ink-mute">({p.short})</span>
                </b>
                <a href={mapUrl(p.name)} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs font-bold text-brand">
                  지도 ↗
                </a>
              </span>
              <span>
                입장료 <b className="text-brand">{p.fee}</b>
              </span>
              <span className="text-ink-sub">
                {p.depth} · {p.for}
              </span>
              {p.tips.map((t) => (
                <span key={t} className="text-xs font-bold text-amber-800">
                  {t}
                </span>
              ))}
            </li>
          ))}
        </ul>
        <p className="text-xs text-ink-mute">입장료는 풀장 사정에 따라 바뀔 수 있어요.</p>
      </Block>

      <Block title="준비물">
        <Bullets
          items={[
            <>수영복 (래시가드·레깅스 가능)</>,
            <>수모(수영모) — 대부분의 풀장에서 필수예요</>,
            <>세면도구 · 수건 · 갈아입을 옷</>,
            <>
              개인 장비가 있다면 마스크 · 스노클 · 핀 · 웨이트. 없으면 신청할 때 대여를 체크해요 (마스크·스노클 3,000원 · 롱핀
              8,000원 · 웨이트 5,000원 · 슈트 현장 대여)
            </>,
            <>물 · 간단한 간식 (교육이 약 3시간이에요)</>,
          ]}
        />
      </Block>

      <Block title="도착해서 할 일">
        <Steps
          items={[
            <>시작 20분 전 도착해서 안내데스크에서 입장료를 결제해요.</>,
            <>탈의실에서 갈아입고 샤워를 해요.</>,
            <>풀장에 들어가서 강사를 찾아요. 대여 장비는 강사가 준비해 둬요.</>,
            <>몸풀기 스트레칭과 오늘 할 내용을 함께 확인하고 시작해요.</>,
          ]}
        />
        <Note>늦을 것 같으면 미리 연락 주세요. 정해진 레인·시간을 함께 쓰기 때문에 시작이 늦어지면 연습 시간이 줄어요.</Note>
      </Block>

      <Block title="풀장 안에서 지켜요">
        <Bullets
          items={[
            <>혼자 숨참기·잠수를 하지 않아요. 항상 버디나 강사가 지켜보는 상태에서만 해요.</>,
            <>안내 받은 레인과 구역만 써요.</>,
            <>몸이 안 좋거나 귀가 아프면 바로 말하고 쉬어요.</>,
          ]}
        />
      </Block>

      <Link
        href="/schedule"
        className="mx-4 mb-8 mt-4 flex min-h-12 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white"
      >
        일정 보고 신청하기
      </Link>
    </>
  );
}
