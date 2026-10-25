// 노션 연동: 강습영상 MASTER DB · 로그북 DB(교육생) 읽기 전용
// 필요 환경변수: NOTION_TOKEN (노션 연결 키)
// 선택: NOTION_VIDEO_DB_ID, NOTION_STUDENT_DB_ID, NOTION_API_BASE(테스트용)

const API = process.env.NOTION_API_BASE ?? "https://api.notion.com";
const VERSION = "2022-06-28";

export const VIDEO_DB_ID = process.env.NOTION_VIDEO_DB_ID ?? "2fc01ba640b180b8bcbaeb93db83bf71"; // 강습영상 MASTER DB
export const STUDENT_DB_ID = process.env.NOTION_STUDENT_DB_ID ?? "1c801ba640b1805f9cfcdf65e93727d9"; // 로그북 DB

// 노션 속성 이름 (노션에서 이름을 바꾸면 여기도 같이 바꿔야 함)
const P = {
  title: "영상 제목",
  date: "촬영일",
  feedback: "피드백",
  status: "상태",
  student: "로그",
  studentName: "이름",
};

export const notionEnabled = () => Boolean(process.env.NOTION_TOKEN);

/** 노션 id 비교용: 하이픈 제거 · 소문자 */
export const normId = (id: string) => id.replace(/-/g, "").toLowerCase();

async function notion<T>(path: string, init?: { method?: string; body?: unknown; revalidate?: number }): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
      "Notion-Version": VERSION,
      "Content-Type": "application/json",
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    // 영상 주소는 1시간 뒤 만료 → 30분까지만 캐시
    next: { revalidate: init?.revalidate ?? 0 },
  });
  if (!res.ok) throw new Error(`Notion ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json() as Promise<T>;
}

// ── 응답 타입 (필요한 부분만) ──
type RichText = { plain_text: string }[];
type Prop =
  | { type: "title"; title: RichText }
  | { type: "rich_text"; rich_text: RichText }
  | { type: "date"; date: { start: string } | null }
  | { type: "status"; status: { name: string } | null }
  | { type: "relation"; relation: { id: string }[] }
  | { type: string; [k: string]: unknown };
type Page = { id: string; parent?: { database_id?: string }; last_edited_time: string; properties: Record<string, Prop> };
type Block = {
  id: string;
  type: string;
  has_children: boolean;
  video?: { type: "file" | "external"; file?: { url: string }; external?: { url: string }; caption?: RichText };
};

const text = (p?: Prop) =>
  p && "title" in p && p.type === "title"
    ? (p.title as RichText).map((t) => t.plain_text).join("")
    : p && p.type === "rich_text"
      ? ((p as { rich_text: RichText }).rich_text ?? []).map((t) => t.plain_text).join("")
      : "";

export type VideoEntry = {
  pageId: string;
  title: string;
  date: string | null; // YYYY-MM-DD
  status: string; // 업로드됨 · 피드백 작성 중 · 완료
  feedback: string;
  studentPageIds: string[];
  editedAt: string;
};

function toEntry(p: Page): VideoEntry {
  const date = p.properties[P.date] as Extract<Prop, { type: "date" }> | undefined;
  const status = p.properties[P.status] as Extract<Prop, { type: "status" }> | undefined;
  const rel = p.properties[P.student] as Extract<Prop, { type: "relation" }> | undefined;
  return {
    pageId: p.id,
    title: text(p.properties[P.title]),
    date: date?.date?.start?.slice(0, 10) ?? null,
    status: status?.status?.name ?? "",
    feedback: text(p.properties[P.feedback]),
    studentPageIds: (rel?.relation ?? []).map((r) => r.id),
    editedAt: p.last_edited_time,
  };
}

/** 한 교육생의 강습영상 목록 (최근 촬영일 순) */
export async function listVideosForStudent(studentPageId: string): Promise<VideoEntry[]> {
  const out: VideoEntry[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion<{ results: Page[]; has_more: boolean; next_cursor: string | null }>(
      `/v1/databases/${VIDEO_DB_ID}/query`,
      {
        method: "POST",
        body: {
          filter: { property: P.student, relation: { contains: studentPageId } },
          sorts: [{ property: P.date, direction: "descending" }],
          page_size: 100,
          start_cursor: cursor,
        },
      },
    );
    out.push(...res.results.map(toEntry));
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return out;
}

/** 최근 수정된 강습영상 (피드백 알림 점검용) */
export async function listRecentlyEditedVideos(sinceIso: string): Promise<VideoEntry[]> {
  const out: VideoEntry[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion<{ results: Page[]; has_more: boolean; next_cursor: string | null }>(
      `/v1/databases/${VIDEO_DB_ID}/query`,
      {
        method: "POST",
        body: {
          filter: { timestamp: "last_edited_time", last_edited_time: { on_or_after: sinceIso } },
          page_size: 100,
          start_cursor: cursor,
        },
      },
    );
    out.push(...res.results.map(toEntry));
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return out;
}

export async function getVideoEntry(pageId: string): Promise<(VideoEntry & { inVideoDb: boolean }) | null> {
  try {
    const p = await notion<Page>(`/v1/pages/${pageId}`);
    return { ...toEntry(p), inVideoDb: normId(p.parent?.database_id ?? "") === normId(VIDEO_DB_ID) };
  } catch {
    return null;
  }
}

export type VideoFile = { url: string; name: string; caption: string; external: boolean };

/** 페이지 본문의 영상들 (열(column) 안의 영상까지) */
export async function listVideoFiles(pageId: string): Promise<VideoFile[]> {
  const files: VideoFile[] = [];
  async function walk(blockId: string, depth: number) {
    let cursor: string | undefined;
    do {
      const res = await notion<{ results: Block[]; has_more: boolean; next_cursor: string | null }>(
        `/v1/blocks/${blockId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ""}`,
        { revalidate: 1800 },
      );
      for (const b of res.results) {
        if (b.type === "video" && b.video) {
          const url = b.video.type === "file" ? b.video.file?.url : b.video.external?.url;
          if (url) {
            const name = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "영상");
            files.push({
              url,
              name,
              caption: (b.video.caption ?? []).map((t) => t.plain_text).join(""),
              external: b.video.type === "external",
            });
          }
        } else if (b.has_children && depth < 3 && ["column_list", "column", "toggle", "callout"].includes(b.type)) {
          await walk(b.id, depth + 1);
        }
      }
      cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
    } while (cursor);
  }
  await walk(pageId, 0);
  return files;
}

/** 로그북 DB 교육생 목록 (회원 연결용) */
export async function listNotionStudents(): Promise<{ id: string; name: string }[]> {
  const out: { id: string; name: string }[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion<{ results: Page[]; has_more: boolean; next_cursor: string | null }>(
      `/v1/databases/${STUDENT_DB_ID}/query`,
      { method: "POST", body: { page_size: 100, start_cursor: cursor } },
    );
    out.push(...res.results.map((p) => ({ id: p.id, name: text(p.properties[P.studentName]) })));
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return out.sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

/** 유튜브 등 외부 링크면 퍼가기 주소로 */
export function embedUrl(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
}
