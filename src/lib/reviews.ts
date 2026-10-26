// 강습·투어 후기: 네이버 카페 글을 검색 API로 모아 링크 카드로 보여줌
// - 검색 API는 제목·앞부분 요약·링크만 줌 (본문 전체·사진·작성일은 없음)
// - 게시판 이름으로 거를 수 없어서, 우리 카페 글 중 제목·요약에 '후기'가 있는 글을 모음
// - 관리자 화면에서 숨김·분류 변경·상단 고정·직접 추가
//
// 필요 환경변수 (NAVER API HUB): NAVER_API_KEY_ID, NAVER_API_KEY
// (예전 개발자센터 키가 있으면 NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 도 사용 가능)
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, tables } from "@/db";

const { reviews, appSettings } = tables;

export const CAFE_ID = "deeptailfreediving";
export const CAFE_URL = `https://cafe.naver.com/${CAFE_ID}`;
export const REVIEW_BOARD = "딥테일 프리다이빙 강습 후기";

// 우리 카페 후기글이 걸리도록 여러 검색어로 찾음
const QUERIES = ["딥테일 후기", "딥테일 프리다이빙 후기", "딥테일프리다이빙 후기", "딥테일 강습 후기", "딥테일 투어 후기"];
const PAGES_PER_QUERY = 3; // 검색어당 최대 300건
const SYNC_KEY = "reviews.lastSync";
const AUTO_SYNC_HOURS = 6;

const TOUR_WORDS = /투어|이시가키|보홀|세부|모알보알|다합|팡라오|발리|오키나와|사이판|괌|필리핀|미야케지마|돌고래/;
const LESSON_WORDS = /강습|체험|aida|아이다|레벨|자격증|취득|수업|과정|트레이닝/i;

export type SyncResult = { at: string; ok: boolean; found: number; added: number; error?: string };

export const reviewsEnabled = () =>
  Boolean(
    (process.env.NAVER_API_KEY_ID && process.env.NAVER_API_KEY) ||
      (process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET),
  );

type Item = { title: string; link: string; description: string; cafename?: string; cafeurl?: string };

const ENTITIES: Record<string, string> = { "&quot;": '"', "&amp;": "&", "&lt;": "<", "&gt;": ">", "&#39;": "'", "&apos;": "'", "&nbsp;": " " };
export function cleanText(s: string) {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&(quot|amp|lt|gt|#39|apos|nbsp);/g, (m) => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

/** 카페 글 주소 → 글 번호. 우리 카페 글이 아니면 null */
export function articleKeyOf(link: string, cafeurl?: string): string | null {
  const l = link.toLowerCase();
  const ours = l.includes(`cafe.naver.com/${CAFE_ID}`) || (cafeurl ?? "").toLowerCase().includes(CAFE_ID);
  if (!ours) return null;
  const m = l.match(new RegExp(`${CAFE_ID}/(\\d+)`)) ?? l.match(/articles\/(\d+)/) ?? l.match(/articleid=(\d+)/);
  return m ? m[1] : null;
}

export const articleUrl = (key: string) => `${CAFE_URL}/${key}`;
/** 제목을 먼저 보고, 제목으로 알 수 없을 때만 요약을 봄 */
export function guessCategory(title: string, excerpt = ""): "TOUR" | "LESSON" {
  if (TOUR_WORDS.test(title)) return "TOUR";
  if (LESSON_WORDS.test(title)) return "LESSON";
  return TOUR_WORDS.test(excerpt) && !LESSON_WORDS.test(excerpt) ? "TOUR" : "LESSON";
}

// fresh=true: 관리자 버튼·예약 작업 (항상 새로 요청)
// fresh=false: 미리 만들어 두는 화면을 만들 때 (Next.js 캐시 규칙상 10분 캐시 허용)
async function searchPage(query: string, start: number, fresh: boolean): Promise<Item[]> {
  const params = new URLSearchParams({ query, display: "100", start: String(start), sort: "date" });
  let url: string;
  let headers: Record<string, string>;
  if (process.env.NAVER_API_KEY_ID && process.env.NAVER_API_KEY) {
    params.set("format", "json");
    url = `https://naverapihub.apigw.ntruss.com/search/v1/cafearticle?${params}`;
    headers = {
      "X-NCP-APIGW-API-KEY-ID": process.env.NAVER_API_KEY_ID,
      "X-NCP-APIGW-API-KEY": process.env.NAVER_API_KEY,
    };
  } else {
    url = `https://openapi.naver.com/v1/search/cafearticle.json?${params}`;
    headers = {
      "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID ?? "",
      "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET ?? "",
    };
  }
  const res = await fetch(process.env.NAVER_SEARCH_URL_OVERRIDE ? `${process.env.NAVER_SEARCH_URL_OVERRIDE}?${params}` : url, {
    headers,
    ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: 600 } }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`네이버 검색 응답 ${res.status} ${body.slice(0, 160)}`);
  }
  const json = (await res.json()) as { items?: Item[] };
  return json.items ?? [];
}

/** 네이버 카페에서 후기글을 찾아 새 글만 추가 (이미 있는 글은 제목·요약만 갱신) */
export async function syncReviews({ fresh = true }: { fresh?: boolean } = {}): Promise<SyncResult> {
  const at = new Date().toISOString();
  let result: SyncResult;
  try {
    if (!reviewsEnabled()) throw new Error("네이버 검색 API 키가 없어요 (NAVER_API_KEY_ID, NAVER_API_KEY)");
    const found = new Map<string, { title: string; excerpt: string }>();
    for (const q of QUERIES) {
      for (let p = 0; p < PAGES_PER_QUERY; p++) {
        const items = await searchPage(q, 1 + p * 100, fresh);
        for (const it of items) {
          const key = articleKeyOf(it.link, it.cafeurl);
          if (!key) continue;
          const title = cleanText(it.title);
          const excerpt = cleanText(it.description);
          if (!/후기/.test(`${title} ${excerpt}`)) continue;
          found.set(key, { title, excerpt });
        }
        if (items.length < 100) break;
      }
    }

    let added = 0;
    if (found.size) {
      const keys = [...found.keys()];
      const existing = await db
        .select({ key: reviews.articleKey, source: reviews.source })
        .from(reviews)
        .where(inArray(reviews.articleKey, keys));
      const have = new Map(existing.map((e) => [e.key, e.source]));
      const fresh = keys.filter((k) => !have.has(k));
      if (fresh.length) {
        await db.insert(reviews).values(
          fresh.map((k) => {
            const f = found.get(k)!;
            return {
              articleKey: k,
              url: articleUrl(k),
              title: f.title,
              excerpt: f.excerpt,
              category: guessCategory(f.title, f.excerpt),
            };
          }),
        ).onConflictDoNothing();
        added = fresh.length;
      }
      // 검색으로 들어온 글은 제목이 바뀌었을 수 있어 갱신 (직접 추가한 글은 그대로)
      // 분류는 관리자가 직접 바꾼 적이 없을 때만 다시 자동 분류
      for (const k of keys.filter((k) => have.get(k) === "SEARCH")) {
        const f = found.get(k)!;
        await db
          .update(reviews)
          .set({
            title: f.title,
            excerpt: f.excerpt,
            category: sql`case when ${reviews.categoryManual} then ${reviews.category} else ${guessCategory(f.title, f.excerpt)}::review_category end`,
          })
          .where(and(eq(reviews.articleKey, k), eq(reviews.source, "SEARCH")));
      }
    }
    result = { at, ok: true, found: found.size, added };
  } catch (e) {
    result = { at, ok: false, found: 0, added: 0, error: (e as Error).message };
  }
  await db
    .insert(appSettings)
    .values({ key: SYNC_KEY, value: JSON.stringify(result) })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: JSON.stringify(result) } });
  return result;
}

export async function lastSync(): Promise<SyncResult | null> {
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, SYNC_KEY));
  return row ? (JSON.parse(row.value) as SyncResult) : null;
}

/** 후기 화면을 만들 때 6시간 넘게 안 가져왔으면 한 번 가져옴 */
export async function syncIfStale() {
  if (!reviewsEnabled()) return;
  const last = await lastSync();
  if (last && Date.now() - new Date(last.at).getTime() < AUTO_SYNC_HOURS * 3_600_000) return;
  await syncReviews({ fresh: false });
}

// 글 번호가 클수록 최근 글 → 최신순 정렬에 사용
const newestFirst = sql`case when ${reviews.articleKey} ~ '^[0-9]+$' then ${reviews.articleKey}::bigint else 0 end`;

export async function listPublicReviews() {
  return db
    .select({
      id: reviews.id,
      url: reviews.url,
      title: reviews.title,
      excerpt: reviews.excerpt,
      category: reviews.category,
      pinned: reviews.pinned,
    })
    .from(reviews)
    .where(eq(reviews.hidden, false))
    .orderBy(desc(reviews.pinned), desc(newestFirst), desc(reviews.createdAt));
}

export async function listAllReviews() {
  return db.select().from(reviews).orderBy(desc(reviews.pinned), desc(newestFirst), desc(reviews.createdAt));
}

export const categoryLabel = { LESSON: "강습후기", TOUR: "투어후기" } as const;
