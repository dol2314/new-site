/**
 * 과세기간 중 소유권 이전(매매·증여) 때 자동차세 일할계산 — 비영업용 승용자동차.
 *
 * 법령값은 이 파일에 쓰지 않는다. ProrateParams로 받는다(packages/data/data/car-tax/{연도}.json).
 *
 * 계산 구조 (2026-11-01 국가법령정보센터 현행본으로 확인):
 * - 과세기간 중 승계취득하고 이전등록하면 소유기간에 따라 일할계산해 양도인·양수인에게 각각 부과 (지방세법 제129조)
 * - 기준일은 소유권 이전등록일. 일할계산 신청서 + 증명서류를 내면 증명된 양도일 (제130조제3항)
 * - 일할계산 금액 (지방세법 시행령 제126조):
 *     기본: 연세액 × 과세대상기간 일수 ÷ 해당 연도 총일수
 *     사용연수(차령) 3년 이상 비영업용 승용: 해당 기분세액 × 과세대상기간 일수 ÷ 해당 기분 총일수
 * - 계산한 세액이 2천원 미만이면 징수하지 않음 (제130조제4항)
 * - 나뉘는 것은 이전일이 속한 기분만. 그 전 기분은 양도인, 그 뒤 기분은 양수인 몫.
 * - 이전일 당일이 누구 몫인지는 transferDayOwner로 받는다 (법령·시행령·서식에 명시 없음 → 데이터에서 확인 상태 관리).
 * - 지방교육세 = 일할계산한 자동차세 × 교육세율, 금액마다 10원 미만 버림.
 */
import type { CarTaxResult, HalfTax } from "./carTax";
import { addDays, daysInYear, diffDays, type IsoDate } from "./dates";
import { truncateTo } from "./money";

export interface ProrateParams {
  /** 이 금액 미만이면 징수하지 않음 (자동차세 기준) */
  minCollectWon: number;
  /** 시행령 제126조 단서(기분 기준)가 적용되는 최소 차령 */
  halfBasisMinAge: number;
  /** 이전일 당일을 누구 소유기간에 넣는지 */
  transferDayOwner: "buyer" | "seller";
  educationTaxRate: number;
  truncateUnit: number;
}

export interface ProrateShare {
  from: IsoDate;
  to: IsoDate;
  days: number;
  carTax: number;
  educationTax: number;
  total: number;
  /** 2천원 미만이라 징수하지 않음 */
  waived: boolean;
}

export interface ProrateResult {
  half: 1 | 2;
  halfStart: IsoDate;
  halfEnd: IsoDate;
  halfDays: number;
  basis: "half" | "annual";
  /** 계산식 설명 */
  rule: string;
  seller: ProrateShare;
  buyer: ProrateShare;
  /** 양도인이 이 해에 내는 자동차세+교육세 (이전일이 2기분이면 1기분 전액 포함) */
  sellerYearTotal: number;
  /** 양수인이 이 해에 내는 자동차세+교육세 (이전일이 1기분이면 2기분 전액 포함) */
  buyerYearTotal: number;
}

export function calcTransferProrate(
  tax: CarTaxResult,
  transferDate: IsoDate,
  year: number,
  p: ProrateParams,
): ProrateResult {
  if (!transferDate.startsWith(`${year}-`))
    throw new RangeError(`이전일이 ${year}년이 아님: ${transferDate}`);
  const month = Number(transferDate.slice(5, 7));
  const half: 1 | 2 = month <= 6 ? 1 : 2;
  const halfStart = half === 1 ? `${year}-01-01` : `${year}-07-01`;
  const halfEnd = half === 1 ? `${year}-06-30` : `${year}-12-31`;
  const halfDays = diffDays(halfStart, halfEnd) + 1;
  const h = tax.halves[half - 1] as HalfTax;

  // 양도인: 기분 시작 ~ 경계 전날, 양수인: 경계 ~ 기분 끝
  const boundary =
    p.transferDayOwner === "buyer" ? transferDate : addDays(transferDate, 1);
  if (
    diffDays(halfStart, boundary) < 0 ||
    diffDays(boundary, addDays(halfEnd, 1)) < 0
  )
    throw new RangeError("경계일이 기분 밖");
  const sellerDays = diffDays(halfStart, boundary);
  const buyerDays = halfDays - sellerDays;

  const halfBasis = !tax.flat && h.carAge >= p.halfBasisMinAge;
  const per = (days: number) =>
    halfBasis
      ? (h.carTax * days) / halfDays
      : (tax.baseAnnual * days) / daysInYear(year);
  const rule = halfBasis
    ? `제${half}기분세액 ${h.carTax.toLocaleString("ko-KR")}원 × 소유 일수 ÷ ${halfDays}일`
    : `연세액 ${tax.baseAnnual.toLocaleString("ko-KR")}원 × 소유 일수 ÷ ${daysInYear(year)}일`;

  const share = (from: IsoDate, days: number): ProrateShare => {
    const to = days > 0 ? addDays(from, days - 1) : from;
    const raw = truncateTo(per(days), p.truncateUnit);
    const waived = raw < p.minCollectWon;
    const carTax = waived ? 0 : raw;
    const educationTax = truncateTo(
      carTax * p.educationTaxRate,
      p.truncateUnit,
    );
    return {
      from,
      to,
      days,
      carTax,
      educationTax,
      total: carTax + educationTax,
      waived: waived && days > 0,
    };
  };
  const seller = share(halfStart, sellerDays);
  const buyer = share(boundary, buyerDays);
  const other = tax.halves[half === 1 ? 1 : 0] as HalfTax;
  return {
    half,
    halfStart,
    halfEnd,
    halfDays,
    basis: halfBasis ? "half" : "annual",
    rule,
    seller,
    buyer,
    sellerYearTotal: seller.total + (half === 2 ? other.total : 0),
    buyerYearTotal: buyer.total + (half === 1 ? other.total : 0),
  };
}
