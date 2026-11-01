# 운영자 설정 안내 (Cloudflare 배포·검색 등록·공개 전환)

코드 밖에서 운영자가 직접 하는 일. Claude Code는 이 작업을 대신하지 않는다.

## 1. Cloudflare 연결 (Workers 정적 자산 방식 — 지금 해도 됨)

Cloudflare 대시보드의 "Workers & Pages → 만들기"는 이제 기본이 Workers다. 이 저장소는 서버 코드 없이 정적 파일만 올리며, 설정은 저장소 루트 `wrangler.jsonc`에 있다(업로드 폴더 `apps/web/out`, 끝 슬래시 자동 처리, 404 페이지).

1. Git 저장소 연결 → `dol2314/new-site`
2. Set up your application 화면
   - Project name: `new-site` (`wrangler.jsonc`의 `name`과 같아야 함. 바꾸면 둘 다 바꾼다)
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
   - Preview command: 기본값 그대로 (미리보기 빌드는 켜도 됨 — 공개 전 모드라 검색에 안 잡힌다)
3. Advanced settings
   - Path(루트 디렉터리): 비워 두거나 `/`
   - **Build variables**(빌드 변수 — 런타임 Variables가 아님. `NEXT_PUBLIC_*` 값은 빌드할 때 HTML에 들어간다)
     - `NODE_VERSION` = `22`
     - (이름·도메인 확정 후) `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_SITE_INDEXABLE`은 **넣지 않는다**(= 공개 전 모드: 전체 noindex, robots.txt 전체 차단)
4. Deploy → `new-site.<계정>.workers.dev` 주소에서 홈·소개·데이터 출처·개인정보처리방침이 보이는지, 없는 주소에서 한국어 404가 나오는지 확인

참고: `/about`처럼 끝 슬래시가 없는 주소는 `/about/`로 307(임시) 이동한다. 사이트 안 링크와 canonical은 모두 슬래시로 끝나서 영향은 작지만, 도메인을 연결한 뒤 아래 2-5의 301 규칙을 추가한다.

## 2. 도메인 연결 (도메인 구매 후)

1. Worker(new-site) → 설정 → 도메인 및 경로 → 사용자 지정 도메인 추가 (`example.com`과 `www.example.com` 둘 다)
2. www를 루트로 301 이동: 대시보드 → 규칙 → 리디렉션 규칙 → `www.example.com/*` → `https://example.com/${1}` (301, 쿼리 유지)
3. SSL/TLS → 엣지 인증서 → **항상 HTTPS 사용** 켜기
4. 끝 슬래시 301: 규칙 → 리디렉션 규칙 → 사용자 지정 필터 식
   `(http.host eq "example.com" and not ends_with(http.request.uri.path, "/") and not http.request.uri.path contains ".")`
   → 동적, `concat("https://example.com", http.request.uri.path, "/")`, 301, 쿼리 유지
5. 확인: `curl -sI http://example.com/` → 301, `curl -sI https://www.example.com/about/` → 301 → `https://example.com/about/`, `curl -sI https://example.com/about` → 301

## 3. 공개 전환 (첫 도구 2개가 품질 검사를 통과한 뒤 — 프롬프트 05 이후)

1. Build variables 추가 (Worker → 설정 → 빌드 → 변수) 후 재배포
   - `NEXT_PUBLIC_OPERATOR_NAME`, `NEXT_PUBLIC_OPERATOR_EMAIL` (소개·문의·개인정보처리방침에 표시됨)
   - `NEXT_PUBLIC_GA_ID` (GA4 측정 ID, `G-`로 시작)
   - `NEXT_PUBLIC_SITE_INDEXABLE` = `true`
2. 재배포 후 확인: 로컬에서 같은 환경변수로 `npm run build && npm run check:seo` → "통과"
3. 검색 등록
   - 구글 서치콘솔: 도메인 속성 추가 → Cloudflare DNS에 TXT 레코드 → 사이트맵 `https://도메인/sitemap.xml` 제출
   - 네이버 서치어드바이저: 사이트 등록 → 소유 확인(메타 태그면 `NEXT_PUBLIC_NAVER_SITE_VERIFICATION`에 값만 넣고 재배포) → 사이트맵·RSS(`/rss.xml`) 제출
   - Bing 웹마스터 도구: 서치콘솔에서 가져오기
4. 각 도구 페이지를 공개할 때마다 서치콘솔 "URL 검사 → 색인 생성 요청", 서치어드바이저 "웹 페이지 수집 요청"

## 3-1. 묶음 공개 전 점검 (매번)

공개 순서와 날짜는 `docs/adsense/launch-plan.md`.

1. `LAUNCH_PREVIEW=1 npm run build && npm run check:launch -- --mobile` — 공개 뒤 구조를 미리 검사(로컬 전용. Cloudflare 변수에 넣지 않는다. 공개 모드와 함께 켜면 빌드가 멈춘다)
2. 검수한 페이지를 `published: true`로 바꾼 뒤 `npm run check:all` — 하나라도 실패하면 배포하지 않는다

## 4. 애드센스 (도구 5개 + 글 20편 이후 — 프롬프트 09)

1. 애드센스에 사이트 추가 → 게시자 ID(`pub-` + 숫자 16자리) 확인
2. Build variable `ADSENSE_PUB_ID` = `pub-...` → 재배포하면 `/ads.txt`가 생성됨 (`https://도메인/ads.txt` 확인)
3. 신청 전 프롬프트 09의 1단계 점검표 실행 — 지난 결과는 `docs/adsense/pre-approval.md`
