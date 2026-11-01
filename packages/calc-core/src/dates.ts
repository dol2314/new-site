/**
 * 날짜 계산. 모든 날짜는 "YYYY-MM-DD" 문자열로 주고받고, 내부 계산은 UTC 자정 기준으로 한다
 * (기기 시간대에 따라 하루가 밀리지 않게).
 */
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

export type IsoDate = string;

export function parseDate(s: IsoDate): number {
  const m = DATE_RE.exec(s);
  if (!m) throw new RangeError(`날짜 형식은 YYYY-MM-DD: ${s}`);
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = Date.UTC(y, mo - 1, d);
  const back = new Date(t);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) {
    throw new RangeError(`없는 날짜: ${s}`);
  }
  return t;
}

export function formatDate(t: number): IsoDate {
  return new Date(t).toISOString().slice(0, 10);
}

export function addDays(s: IsoDate, days: number): IsoDate {
  return formatDate(parseDate(s) + days * DAY_MS);
}

/** b - a (일). 같은 날이면 0 */
export function diffDays(a: IsoDate, b: IsoDate): number {
  return Math.round((parseDate(b) - parseDate(a)) / DAY_MS);
}

/** 해당 연·월로 years년 뒤의 같은 날. 2월 29일 → 평년이면 2월 28일 */
export function addYears(s: IsoDate, years: number): IsoDate {
  const d = new Date(parseDate(s));
  const y = d.getUTCFullYear() + years;
  const m = d.getUTCMonth();
  const day = Math.min(d.getUTCDate(), daysInMonth(y, m + 1));
  return formatDate(Date.UTC(y, m, day));
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
