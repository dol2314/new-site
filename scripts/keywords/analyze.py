"""키워드 내보내기 파일(네이버 키워드 도구 xlsx, 구글 키워드 플래너 csv)을 도구별로 분류·집계한다.

사용: python3 scripts/keywords/analyze.py
입력: docs/keywords/raw/naver-*.xlsx, docs/keywords/raw/google-*.csv
출력: docs/keywords/keywords-classified.csv, docs/keywords/summary.json (priority.md 작성용)

주의: 수치는 내보내기 파일 값 그대로다. 네이버 "< 10"은 5로 계산한다.
구글 플래너는 광고 집행 이력이 없는 계정이라 검색량이 구간값(0/50/500/5000/50000)으로만 나온다.
"""
from __future__ import annotations

import csv
import glob
import json
import re
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "docs" / "keywords" / "raw"
OUT = ROOT / "docs" / "keywords"


def num(v) -> float:
    if v is None or v == "" or v == "-":
        return 0.0
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).replace(",", "").replace("%", "").strip()
    if s.startswith("<"):
        return 5.0
    try:
        return float(s)
    except ValueError:
        return 0.0


def norm(k: str) -> str:
    return re.sub(r"\s+", "", k).lower()


# 도구 분류 규칙: 위에서부터 먼저 맞는 것. (도구ID, 정규식) — 정규화(공백 제거·소문자)된 키워드에 적용
OUT_OF_SCOPE = r"아파트|부동산|상가|토지|주택취득|오토바이|이륜차|재산세|보험연납|자동차보험|충전기설치|충전기보조금|급속충전기보조금"
RULES: list[tuple[str, str]] = [
    ("inspection", r"검사"),
    ("loan", r"할부|리스|렌트|장기렌트|대출|금리|월납"),
    ("registration-tax", r"취등록세|취득세|등록세|이전비|이전등록|부대비용|과세표준|공채"),
    ("car-tax", r"자동차세|자동차세금|차량세금|차세계산|연납|선납|wetax|위택스|이택스|etax"),
    ("ev-subsidy", r"보조금|지원금|실구매가|구매지원|국고"),
    ("fuel-cost", r"충전요금|충전비용|충전가격|충전단가|충전료|전기요금|전기세|전기료|전기값|완충요금|집밥|유류비|기름값|주유비|유가|휘발유가|경유가|연비계산|기본요금|기본료|차지비|에버온|파워큐브|플러그링크|지차저|채비|해피차저|휴맥스|클린일렉스|kepcoplug|차지인|환경부충전"),
    ("compare", r"유지비|유지비용|총비용|비교|차이|하이브리드vs|vs"),
]


def classify(k: str) -> str:
    n = norm(k)
    if re.search(OUT_OF_SCOPE, n):
        return "out-of-scope"
    for tool, pat in RULES:
        if re.search(pat, n):
            return tool
    return "other"


def intent(k: str) -> str:
    n = norm(k)
    if re.search(r"계산|얼마|금액|요금|비용|가격|단가|과태료|실구매가", n):
        return "계산"
    if re.search(r"비교|차이|vs|추천|순위", n):
        return "비교"
    if re.search(r"방법|신청|하는법|받는법|예약|납부|조회|확인|절차", n):
        return "방법·조회"
    if re.search(r"기준|기간|대상|조건|정책|지역별", n):
        return "조건"
    return "기타"


def load_naver() -> dict[str, dict]:
    data: dict[str, dict] = {}
    for f in sorted(glob.glob(str(RAW / "naver-*.xlsx"))):
        rows = list(openpyxl.load_workbook(f, read_only=True).worksheets[0].iter_rows(values_only=True))[2:]
        for r in rows:
            if not r or not r[0]:
                continue
            k = str(r[0]).strip()
            rec = {
                "keyword": k,
                "pc": num(r[1]),
                "mobile": num(r[2]),
                "clicks_pc": num(r[3]),
                "clicks_mobile": num(r[4]),
                "competition": (r[7] or "").strip() if isinstance(r[7], str) else str(r[7] or ""),
                "ads": num(r[8]),
                "file": Path(f).name,
            }
            key = norm(k)
            if key not in data:
                data[key] = rec
    return data


def load_google() -> dict[str, dict]:
    data: dict[str, dict] = {}
    for f in sorted(glob.glob(str(RAW / "google-*.csv"))):
        with open(f, encoding="utf-16") as fh:
            lines = fh.read().splitlines()[2:]  # 제목, 기간 줄 건너뜀
        reader = csv.DictReader(lines, delimiter="\t")
        for r in reader:
            k = (r.get("Keyword") or "").strip()
            if not k:
                continue
            data[norm(k)] = {
                "g_keyword": k,
                "g_searches": num(r.get("Avg. monthly searches")),
                "g_competition": r.get("Competition") or "",
                "g_bid_low": num(r.get("Top of page bid (low range)")),
                "g_bid_high": num(r.get("Top of page bid (high range)")),
            }
    return data


def main() -> None:
    naver = load_naver()
    google = load_google()
    keys = set(naver) | set(google)
    rows = []
    for key in keys:
        n = naver.get(key, {})
        g = google.get(key, {})
        k = n.get("keyword") or g.get("g_keyword")
        total = n.get("pc", 0) + n.get("mobile", 0)
        rows.append({
            "keyword": k,
            "tool": classify(k),
            "intent": intent(k),
            "naver_pc": int(n.get("pc", 0)),
            "naver_mobile": int(n.get("mobile", 0)),
            "naver_total": int(total),
            "mobile_share": round(n["mobile"] / total, 2) if total else "",
            "naver_clicks": round(n.get("clicks_pc", 0) + n.get("clicks_mobile", 0), 1),
            "naver_competition": n.get("competition", ""),
            "naver_ads": int(n.get("ads", 0)),
            "google_searches_bucket": int(g["g_searches"]) if g else "",
            "google_bid_low": int(g["g_bid_low"]) if g.get("g_bid_low") else "",
            "google_bid_high": int(g["g_bid_high"]) if g.get("g_bid_high") else "",
            "in_naver": bool(n),
            "in_google": bool(g),
        })
    rows.sort(key=lambda r: (-r["naver_total"], r["keyword"]))
    with open(OUT / "keywords-classified.csv", "w", encoding="utf-8-sig", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)

    summary: dict[str, dict] = {}
    for r in rows:
        s = summary.setdefault(r["tool"], {"keywords": 0, "naver_total": 0, "naver_mobile": 0, "naver_clicks": 0.0,
                                           "competition": {}, "bids_high": [], "top": [], "intents": {}})
        s["keywords"] += 1
        s["naver_total"] += r["naver_total"]
        s["naver_mobile"] += r["naver_mobile"]
        s["naver_clicks"] += r["naver_clicks"]
        if r["naver_competition"]:
            s["competition"][r["naver_competition"]] = s["competition"].get(r["naver_competition"], 0) + 1
        s["intents"][r["intent"]] = s["intents"].get(r["intent"], 0) + r["naver_total"]
        if r["google_bid_high"]:
            s["bids_high"].append(r["google_bid_high"])
        if len(s["top"]) < 25:
            s["top"].append((r["keyword"], r["naver_total"], r["intent"], r["naver_competition"],
                             r["google_searches_bucket"], r["google_bid_high"]))
    for s in summary.values():
        b = sorted(s.pop("bids_high"))
        s["google_bid_high_median"] = b[len(b) // 2] if b else None
        s["google_bid_high_count"] = len(b)
        s["naver_clicks"] = round(s["naver_clicks"], 1)
    (OUT / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"naver {len(naver)}개, google {len(google)}개, 합집합 {len(keys)}개")
    for tool, s in sorted(summary.items(), key=lambda x: -x[1]["naver_total"]):
        print(f"{tool:18} kw={s['keywords']:4} naver={s['naver_total']:>9,} clicks={s['naver_clicks']:>8} "
              f"bidHighMed={s['google_bid_high_median']} comp={s['competition']}")


if __name__ == "__main__":
    main()
