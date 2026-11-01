# 차값계산소(가칭) — 자동차 돈 계산 사이트·앱

자동차세·연납, 자동차 검사 기간·과태료, 전기차 보조금, 취등록세, 실구매가·할부, 전기차 충전요금을 공식 기준으로 계산하는 사이트와 안드로이드 앱.

- 기획안: [`docs/plan/README.md`](docs/plan/README.md) · 실행 프롬프트: [`docs/plan/prompts/`](docs/plan/prompts/)
- 키워드 검증: [`docs/keywords/priority.md`](docs/keywords/priority.md)
- 운영자 설정 안내: [`docs/runbook/launch-setup.md`](docs/runbook/launch-setup.md)
- 프로젝트 규칙: [`CLAUDE.md`](CLAUDE.md)

## 구조

| 경로 | 내용 |
|---|---|
| `apps/web` | Next.js(App Router) 정적 출력 → Cloudflare Pages |
| `apps/mobile` | 안드로이드 앱 자리 (프롬프트 11) |
| `packages/calc-core` | 순수 계산 함수 + 테스트 |
| `packages/data` | 기준 데이터 형식·출처 목록 |
| `scripts/` | `check-seo.mjs`(빌드 결과 SEO 검사), `make-og.mjs`(공유 이미지), `gen-ads-txt.mjs`, `keywords/analyze.py` |

## 명령

```bash
npm ci
npm run dev          # http://localhost:3000
npm test             # calc-core·data 테스트
npm run lint && npm run typecheck
npm run build        # apps/web/out 에 정적 파일
npm run check:seo    # 빌드 결과 검사 (공개 전 모드)
NEXT_PUBLIC_SITE_INDEXABLE=true NEXT_PUBLIC_SITE_URL=https://example.com \
NEXT_PUBLIC_OPERATOR_NAME=이름 NEXT_PUBLIC_OPERATOR_EMAIL=메일 npm run build && npm run check:seo   # 공개 모드 점검
NEXT_PUBLIC_SITE_NAME=이름 npm run make:og   # 이름이 정해지면 공유 이미지 다시 생성
```

환경변수는 [`.env.example`](.env.example) 참고. **`NEXT_PUBLIC_SITE_INDEXABLE`이 `true`가 아니면 모든 페이지가 noindex이고 robots.txt가 전체 차단**이다(미완성 사이트가 색인되지 않게).
