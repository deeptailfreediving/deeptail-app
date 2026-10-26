// 카드형 교육자료 (강사가 만든 이미지 카드, public/materials/<slug>/<n>.webp)
export type Deck = { slug: string; title: string; desc: string; cards: string[] };

export const decks: Deck[] = [
  {
    slug: "hyper",
    title: "초과호흡",
    desc: "초과호흡 후 다이빙하면 기절하는 이유",
    cards: ["결론과 이유 — 초과호흡을 하면 호흡충동 신호가 늦게 와요", "그림으로 보기", "초과호흡이란"],
  },
  {
    slug: "prep",
    title: "준비호흡",
    desc: "준비호흡이 필요한 이유와 순서",
    cards: ["준비호흡이 필요한 이유", "준비호흡 순서 — 복식호흡 · 큰호흡 · 안정호흡 · 최종호흡"],
  },
  {
    slug: "buoyancy",
    title: "부력의 종류",
    desc: "양성 · 중성 · 음성부력과 중성부력 수심",
    cards: ["부력의 종류 — 양성 · 중성 · 음성부력", "중성부력 수심", "수심별 부력 그림"],
  },
];

export const getDeck = (slug: string) => decks.find((d) => d.slug === slug);
