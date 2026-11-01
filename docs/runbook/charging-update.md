# 전기차 충전요금 갱신 절차 (수동)

`/ev-charging/`의 공공 충전요금은 `packages/data/data/ev-charging/public.json`에 있다. 자동 수집하지 않는다.

## 왜 수동인가 (2026-11-01 확인)
- 무공해차 통합누리집(ev.or.kr): 자동 접속 차단 페이지가 응답해 robots.txt도 읽을 수 없음 → 수집하지 않음.
- 한국전력(home.kepco.co.kr): robots.txt가 검색엔진 외 모든 봇에 `Disallow: /` → 수집하지 않음. 주택용·충전용 전기요금은 사용자가 직접 넣는다.
- 오피넷(opinet.co.kr): 공식 무료 API가 있으므로 API만 쓴다(키 발급은 운영자). 키가 생기기 전까지 기름값은 사용자가 넣는다.
- 확인 출처: 대한민국 정책브리핑(korea.kr, robots 전체 허용)의 기후에너지환경부 보도자료·카드뉴스.

## 언제 확인하나
- 분기 1회(1·4·7·10월 첫 주), 그리고 충전요금 관련 정부 발표가 보도되면 바로.
- 기후부가 "계시별 전기요금 연동 요금제"를 예고했다(2026-07-01 발표). 시행되면 요금 구조가 바뀌므로 계산 엔진도 고쳐야 한다.

## 확인 방법
1. korea.kr에서 "충전요금"으로 기후에너지환경부 보도자료를 찾는다.
2. 단계별 kWh당 요금과 시행일을 보도자료(또는 카드뉴스 본문)로 확인한다. 기사·블로그 숫자는 쓰지 않는다.
3. `public.json`의 `values.publicTiers`(minKw 이상, maxKw 미만), `effective_date`(시행일), `checked_at`(확인한 날), `source_url`을 고친다. 바뀐 내용이 없으면 `checked_at`만 고친다.
4. 시행일이 미래면 지금 값은 그대로 두고, 시행일에 바꾼다(지금은 한 벌만 지원).
5. `npm test` → `packages/data/src/official.test.ts`의 충전요금 기대값을 새 보도자료 숫자로 고친다.
6. `npm run build && npm run check:quality ev-charging && npm run validate:data`.

## 오피넷 API (운영자 할 일)
1. 오피넷 유가정보 API에서 무료 API 키를 신청한다.
2. 키는 커밋하지 않는다. Cloudflare Workers 빌드 환경변수(또는 CI 시크릿)에 `OPINET_API_KEY`로 넣는다.
3. 키가 생기면 빌드 때 전국 평균 휘발유·경유 가격을 받아 기본값으로 쓰는 작업을 진행한다(요청 간격 1초 이상, 하루 1회).
