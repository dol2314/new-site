/** 한국 시간(Asia/Seoul) 기준 오늘 날짜 "YYYY-MM-DD". 브라우저에서만 호출한다(정적 빌드 시점 날짜가 굳지 않게). */
export function todayKst(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function formatKoreanDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일`;
}


