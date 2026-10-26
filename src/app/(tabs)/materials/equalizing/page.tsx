import PageHeader from "@/components/PageHeader";
import { Block, Bullets, Hook, KeyPoints, Note, Steps, Trouble } from "@/components/Article";

export const metadata = { title: "이퀄라이징 | 딥테일 교육자료" };

// 이퀄라이징 교육자료 — 2026.4 이퀄라이징 세미나 정리 + 강습 핵심 (두괄식)
const methods = [
  {
    name: "발살바",
    level: "체험 · 레벨 1",
    how: "코를 잡고 배에 힘을 줘서 '흥' 하고 밀어요.",
    limit: "배(복압)로 미는 방식이라 깊어질수록 폐가 줄어 압력이 귀까지 잘 안 가요. 얕은 수심용이에요.",
  },
  {
    name: "프렌젤",
    level: "레벨 2 핵심",
    how: "성문(목 안쪽 문)을 닫고, 입·목 안에 담긴 공기를 혀로 밀어 귀로 보내요.",
    limit: "입·목 안 공기를 다 쓰면 더 못 밀어요 → 공기를 다시 채우는 '차징'이 필요해요.",
  },
  {
    name: "마우스필",
    level: "레벨 3 · 4",
    how: "얕은 곳에서 볼에 공기를 가득 채워 두고, 그 공기로 깊은 곳까지 조금씩 밀어요.",
    limit: "공기를 삼키거나 연구개(입천장 안쪽)가 닫히면 실패해요. 힘을 빼는 연습이 먼저예요.",
  },
  {
    name: "BTV",
    level: "보조 기술",
    how: "공기를 밀지 않고 하품하듯 근육으로 이관을 직접 열어요.",
    limit: "익히는 데 오래 걸려요. 다른 방법을 대신하기보다 보조로 써요.",
  },
];

export default function EqualizingPage() {
  return (
    <>
      <PageHeader title="이퀄라이징" back="/materials" />

      <Hook question="왜 2~3m만 내려가도 귀가 먹먹하고 아플까요?">
        <p>
          물이 귀 안쪽 공기를 누르기 때문이에요. 귀가 아프다는 건 <b className="text-white">이미 늦었다</b>는 신호예요.
        </p>
      </Hook>

      <KeyPoints
        items={[
          <>
            <b>아프기 전에, 자주.</b> 입수 직후부터 1m마다 미리 해요. 아프고 나서 하면 잘 안 돼요.
          </>,
          <>
            <b>힘을 빼고, 성문을 내린 다음 짧게.</b> 세게 오래 미는 게 아니라 짧게 &lsquo;톡톡&rsquo; 보내요.
          </>,
          <>
            <b>안 되면 멈추고 1m 올라가서 다시.</b> 억지로 밀면서 내려가지 않아요.
          </>,
        ]}
      />

      <Block title="왜 그럴까? — 귀 안 공기가 줄어들어서">
        <Bullets
          items={[
            <>수심 10m에서는 공기 부피가 수면의 절반이 돼요. 귀 안(중이) 공기도 똑같이 줄어요.</>,
            <>
              공기가 줄면 고막이 안쪽으로 당겨져요(<b>음압</b>). 이게 먹먹함과 통증이에요.
            </>,
            <>
              코 뒤에서 귀로 이어진 관(<b>이관</b>)으로 공기를 보내 압력을 맞추는 게 <b>이퀄라이징</b>이에요.
            </>,
            <>얕은 곳일수록 압력이 빨리 변해요. 그래서 처음 몇 미터가 가장 바빠요.</>,
          ]}
        />
      </Block>

      <Block title="방법 4가지 — 레벨에 따라 바꿔 가요">
        <ul className="flex flex-col gap-2">
          {methods.map((m) => (
            <li key={m.name} className="flex flex-col gap-1 rounded-xl border border-line p-3.5 text-sm">
              <span className="flex items-center justify-between gap-2">
                <b className="text-[15px]">{m.name}</b>
                <span className="rounded-md bg-brand-tint px-2 py-0.5 text-[11px] font-bold text-brand-mid">{m.level}</span>
              </span>
              <span>{m.how}</span>
              <span className="text-ink-sub">한계 · {m.limit}</span>
            </li>
          ))}
        </ul>
        <Note>
          발살바는 &lsquo;넘어가는 기술&rsquo;이 아니라 차징(공기 끌어올리기)의 기본이에요. 숨을 끝까지 내쉬는 연습이 다른 기술의 바탕이 돼요.
        </Note>
      </Block>

      <Block title="프렌젤 따라 하기">
        <Steps
          items={[
            <>코를 잡고 입은 다물어요. 어깨·목 힘을 빼요.</>,
            <>
              혀를 뒤로 빼거나 아래로 내려서 <b>성문을 내려요</b>. 공기를 담을 공간이 커져요.
            </>,
            <>
              &lsquo;크&rsquo; 발음을 하듯 혀 뒤쪽을 들어 공기를 위로 <b>짧게</b> 밀어요. 귀에서 &lsquo;뽁&rsquo; 소리가 나면 성공이에요.
            </>,
            <>공기가 부족하게 느껴지면 낮은 소리 &lsquo;음~&rsquo;을 내며 공기를 다시 채워요(차징).</>,
          ]}
        />
        <Note>
          성문은 <b>올리는 것보다 내리는 게</b> 훨씬 중요해요. 아래에서부터 올려야 성대에 힘이 실리고 공기도 많이 담겨요.
        </Note>
      </Block>

      <Block title="안 될 때 — 수심별로 원인이 달라요">
        <Trouble
          rows={[
            {
              when: "1~2m에서부터 안 돼요",
              why: "비염·감기 등 코·귀 상태 문제일 가능성이 커요.",
              fix: "무리하지 말고 쉬어요. 계속 그렇다면 이비인후과 진료를 받아 보세요.",
            },
            {
              when: "5m쯤에서 막혀요",
              why: "긴장해서 성대가 닫혔거나, 입·목 안 공기가 다 떨어졌어요.",
              fix: "힘을 빼고 천천히 내려가요. 미리 자주 차징하는 연습을 해요.",
            },
            {
              when: "'칙' 하고 공기 빠지는 소리가 나요",
              why: "성문을 너무 위에서 써서 성대 힘이 약해졌어요.",
              fix: "성문을 아래로 내린 뒤 올리고, 공기를 더 자주 채워요.",
            },
            {
              when: "10~15m에서 갑자기 안 돼요",
              why: "공기를 채우는 위치가 늦었거나, 수온 변화에 몸이 긴장했어요.",
              fix: "더 얕은 곳에서 미리 차징하고, 하강 속도를 줄여서 원인을 하나씩 확인해요.",
            },
          ]}
        />
      </Block>

      <Block title="하루 5분 육상 연습">
        <Steps
          items={[
            <>성문 내리기 · 올리기 10번 (턱과 혀를 내리면 성문도 같이 내려가요)</>,
            <>혀를 앞뒤로 빼기 10번</>,
            <>코 잡고 프렌젤 10번 — 귀가 &lsquo;뽁&rsquo; 할 정도로만 부드럽게</>,
            <>낮은 소리 &lsquo;음~&rsquo;을 내면서 입 안에 공기가 차오르는 느낌 찾기</>,
            <>(레벨 3 이상) 숨을 끝까지 내쉰 뒤 옆구리 쪽 횡격막 스트레칭 — 싫지 않을 정도만</>,
          ]}
        />
        <Note>처음엔 짧게, 꾸준히가 답이에요. 새 이퀄라이징은 반복해서 뇌에 &lsquo;새 패턴&rsquo;으로 입력해야 몸에 붙어요.</Note>
      </Block>

      <Block title="꼭 지켜요">
        <Note tone="warn">
          <Bullets
            items={[
              <>귀가 아프면 바로 멈추고 올라와요. 통증을 참고 내려가면 고막이 다칠 수 있어요.</>,
              <>감기·비염이 심한 날은 다이빙을 쉬어요.</>,
              <>입을 빨대처럼 빨아 공기를 끌어올리는 &lsquo;음압 차징&rsquo;은 무리하면 폐를 다칠 수 있어요. 강사와 함께할 때만 연습해요.</>,
              <>육상 연습에서 높은 소리로 오래 차징하면 성대가 상할 수 있어요. 낮은 소리로 짧게 해요.</>,
            ]}
          />
        </Note>
      </Block>

      <p className="mx-4 mb-8 mt-4 text-center text-xs text-ink-mute">
        궁금한 점은 강습 때나 로그북 피드백으로 물어보세요.
      </p>
    </>
  );
}
