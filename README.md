# 딥테일 프리다이빙 앱

교육생이 일정을 확인하고 수업을 신청하며, 수강 진행도와 로그북을 관리하는 웹앱(PWA)입니다.
휴대폰 브라우저에서 "홈 화면에 추가"하면 앱처럼 쓸 수 있습니다.

## 지금 만들어진 것

- 홈 화면: 공지사항(DB 연동), 바로가기, 하단 탭 4개
- 회원가입 · 로그인 · 로그아웃 (비밀번호는 암호화해 저장)
- 만 14세 미만 가입 차단 및 문의 안내 (보호자 동의 절차 확정 전 임시 조치)
- 로그인해야 들어갈 수 있는 화면: 마이페이지, 교육자료, 일정 신청
- 강사·대표만 들어갈 수 있는 관리자 화면 경로 (`/admin`, 화면은 아직 없음)
- 교육과정 화면: 브랜드 소개, 과정 목록, 자율연습반·정기트레이닝, 유료트레이닝 4종, 장비대여료
- 과정 상세 화면: 회차별 구성, 교육 목표·추천 대상, 교육비·동반 할인·유효기간, 연계 혜택 (교육과정 안내문 기준)
- 입금 계좌 정보 (`src/lib/business.ts`)
- 자율연습반·정기트레이닝 참여 자격 판정 함수 (AIDA 2·3, 2회차 이후)
- 공지 목록 · 상세
- 일정안내 및 예약: 날짜별 일정, 이미 잡힌 수업 시간 '예약됨' 표시 (비회원도 열람)
- 수업 신청: 정규수업(기존 수강권 / 새 과정 등록), 유료트레이닝, 자율연습·정기트레이닝·투어 참여
  - 장비대여료 자동 계산 (AIDA 무료, 체험 묶음 20,000원, 그 외 품목별, 슈트 현장결제)
  - 교육비·입금 계좌 안내, 계좌번호 복사
  - 같은 시간 중복 신청 차단, 자율연습은 AIDA 2·3 2회차 이후만 참여
- 마이페이지: 수강 현황(진행 막대), 내 신청 목록·상세(승인 대기/확정, 입금 대기/결제완료)
- 다음 단계 화면 자리: 사진·영상, 후기, 교육자료, 로그북

## 노션 강습영상 연동 · 푸시 알림

- 영상과 피드백은 지금처럼 노션 **강습영상 MASTER DB**에 올리면, 앱 로그북의 **강습영상** 화면에 자동으로 보임
- 앱 회원 ↔ 노션 로그북 DB 교육생 연결: 관리자 → **노션** 탭
- 피드백이 쓰이면 교육생에게 푸시 알림
  - 노션 웹훅 주소: `https://<앱 주소>/api/notion/webhook` (이벤트: page.properties_updated)
  - 웹훅을 놓쳐도 매일 1번 최근 2일 수정분을 다시 점검 (`vercel.json` cron)
  - 앱 로그북에서 강사가 쓴 피드백도 알림
- 아이폰은 '홈 화면에 추가'한 앱에서 마이페이지 → **알림 켜기** 해야 알림이 옴

## 기술 구성

| 영역 | 사용 기술 |
| --- | --- |
| 화면 + 서버 | Next.js 14 (App Router) + TypeScript |
| 디자인 | Tailwind CSS, Pretendard 글꼴 (SIL Open Font License) |
| DB | PostgreSQL + Drizzle ORM |
| 로그인 | NextAuth (이메일·비밀번호, 카카오 로그인은 추후 추가) |

> 처음 계획은 Prisma였지만 Drizzle로 바꿨습니다. 기능은 같고, 별도 엔진 파일을
> 내려받지 않아도 돼서 설치와 배포(Vercel)가 더 단순합니다.

## 인터넷에 배포하기 (Vercel + Neon)

1. GitHub 저장소에 코드를 올림
2. Vercel에서 **Add New → Project** → 저장소 선택 → Deploy 전에 아래 환경변수 입력
3. Vercel 프로젝트 **Storage → Neon (Postgres)** 연결 → `DATABASE_URL`이 자동으로 들어감
4. 다시 배포(Redeploy)하면 빌드 중에 DB 테이블 생성과 기본 데이터 입력이 자동으로 실행됨 (`vercel-build`)

| 환경변수 | 내용 |
| --- | --- |
| `NEXTAUTH_SECRET` | 임의의 긴 문자열 (`openssl rand -base64 32`) |
| `SEED_ADMIN_EMAIL` | 대표 관리자 로그인 이메일 |
| `SEED_ADMIN_PASSWORD` | 대표 관리자 비밀번호 |
| `SEED_DEMO` | `1`이면 [예시] 일정과 테스트 교육생 계정 생성 (테스트 기간에만) |
| `NOTION_TOKEN` | 노션 연결(Integration) 키 — 강습영상 연동 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` · `VAPID_PRIVATE_KEY` | 웹 푸시 알림 키 (`npx web-push generate-vapid-keys`) |
| `VAPID_SUBJECT` | `mailto:대표 이메일` |
| `CRON_SECRET` | 매일 피드백 점검 작업 보호용 임의 문자열 |

테스트 교육생 계정(`SEED_DEMO=1`): `demo@deeptail.local` / `demo1234` — AIDA 2 수강 중, 2회차 완료라 자율연습 참여 가능

## 내 컴퓨터에서 실행하기

필요한 것: Node.js 20 이상, PostgreSQL

1. PostgreSQL 준비 — 둘 중 하나
   - Mac: [Postgres.app](https://postgresapp.com) 설치 후 실행, `deeptail` 데이터베이스 만들기
   - 클라우드: [Neon](https://neon.tech) 또는 [Supabase](https://supabase.com) 무료 프로젝트 생성 후 연결 주소 복사
2. 환경 설정
   ```bash
   cp .env.example .env
   # .env 파일의 DATABASE_URL을 내 DB 주소로 바꾸고
   # NEXTAUTH_SECRET은 `openssl rand -base64 32` 결과로 바꾸기
   ```
3. 설치 · DB 만들기 · 기본 데이터 넣기
   ```bash
   npm install
   npm run db:migrate
   npm run db:seed
   ```
4. 실행
   ```bash
   npm run dev
   ```
   브라우저에서 http://localhost:3000 접속

### 기본 관리자 계정 (시드)

- 이메일 `admin@deeptail.local` / 비밀번호 `changeme1234`
- 실제 운영 전에 `.env`에 `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`를 지정하고 시드를 다시 실행하세요.

## 폴더 구조

```
src/
  app/
    (tabs)/            하단 탭이 있는 화면들
      page.tsx           홈
      schedule/          일정안내 및 예약
      courses/           교육과정
      my/                마이페이지 (로그인 필요)
      notices/           공지사항 목록·상세
      gallery/ reviews/ materials/
    (auth)/            로그인 · 회원가입
    api/auth/          NextAuth
  components/          하단 탭, 아이콘, 폼 요소
  db/
    schema.ts          DB 구조 (회원, 과정, 횟수권, 장소, 일정, 신청, 공지, 로그북)
    course-data.ts     교육과정 안내문 내용 (과정·회차·혜택 수정은 여기서)
    seed.ts            기본 데이터 (관리자, 장소 7곳, 과정 5개, 유료트레이닝 4종, 장비대여료, 공지 예시)
  lib/auth.ts          로그인 설정
  middleware.ts        로그인·권한 필요한 경로 지정
drizzle/               DB 마이그레이션 파일
```

## DB 구조 요점

- 회원 역할: 교육생 / 강사 / 대표
- 횟수권(`enrollments`): 과정별 총 횟수·사용 횟수·담당강사·결제 상태
- 신청(`registrations`):
  - 종류: 기존 일정 참여 / 정규수업 / 유료트레이닝
  - 상태: 승인 대기 → 확정 → 수업 완료 (정규수업은 담당강사 승인 필요)
  - 결제: 무료 / 미결제 / 결제완료 (앱 밖 계좌이체, 앱은 상태만 관리)
  - 장비대여: 마스크·스노클 3,000원, 롱핀 8,000원, 웨이트 5,000원, 슈트 현장결제 + 발 사이즈, 체중
- 유료트레이닝(`training_options`): 1:1/1:2 × 5m/딥스, 1인 요금
- 일정(`schedules`): 생성 시 관리자 이름·연락처 자동 입력

## 확정되면 반영할 것

- AIDA 4 과정 구성 (안내문 없음)
- 노션 로그북 DB 항목 (현재는 일반적인 프리다이빙 로그북 항목으로 구성)
- 유료트레이닝도 담당강사 승인이 필요한지
- 만 14세 미만 보호자 동의 방식
- 개인정보처리방침 · 보관 기간
- 앱 아이콘 (`public/manifest.webmanifest`의 `icons`)

## 다음 단계

1. 관리자 화면 (일정 등록, 신청 승인, 입금 확인, 수업 완료 처리)
2. 개인 로그북
3. 도메인 연결
