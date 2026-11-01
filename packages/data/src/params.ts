/**
 * 확인된(verified) 데이터만 계산 엔진 매개변수로 바꿔 준다.
 * 확인 전 항목이 하나라도 필요하면 missing에 이름이 들어가고, 그 기능을 쓰는 화면은 공개하지 않는다.
 */
import type { CarTaxParams, EvModel, InspectionCycle, InspectionParams, PenaltyTier, PrepayParams, PrepayPeriod } from "@site/calc-core";
import car2026 from "../data/car-tax/2026.json";
import car2027 from "../data/car-tax/2027.json";
import ev2026 from "../data/ev-subsidy/2026.json";
import inspectionDoc from "../data/inspection/rules.json";
import type { SourcedValue } from "./schema";

interface DataDoc {
  topic: string;
  title: string;
  values: Record<string, SourcedValue<unknown>>;
  rules?: Record<string, SourcedValue<unknown>>;
}

export interface SourceRef {
  key: string;
  source_name: string;
  source_url: string;
  effective_date: string | null;
  checked_at: string | null;
  note?: string;
}

function pick<T>(doc: DataDoc, key: string, missing: string[]): T {
  const [section, name] = key.split(".") as ["values" | "rules", string];
  const v = doc[section]?.[name];
  if (!v || !v.verified || v.value === null) {
    missing.push(key);
    return undefined as T;
  }
  return v.value as T;
}

function refs(doc: DataDoc, keys: string[]): SourceRef[] {
  return keys.map((key) => {
    const [section, name] = key.split(".") as ["values" | "rules", string];
    const v = doc[section]?.[name] as SourcedValue<unknown>;
    return { key, source_name: v.source_name, source_url: v.source_url, effective_date: v.effective_date, checked_at: v.checked_at, note: v.note };
  });
}

const CAR_DOCS: Record<number, DataDoc> = { 2026: car2026 as unknown as DataDoc, 2027: car2027 as unknown as DataDoc };
export const CAR_TAX_YEARS = Object.keys(CAR_DOCS).map(Number);

const CAR_KEYS = [
  "values.ccBrackets",
  "values.flatAnnualWon",
  "values.educationTaxRate",
  "values.ageReduction",
  "values.truncateUnit",
  "values.prepayRate",
  "values.prepayPeriods",
  "values.secondHalfDays",
  "values.dueDates",
  "values.smallTaxRule",
  "rules.carAge",
  "rules.prepayDiscount",
];

export interface CarTaxData {
  year: number;
  tax: CarTaxParams;
  prepay: PrepayParams;
  dueDates: { first: { months: string; due: string }; second: { months: string; due: string } };
  smallTaxThresholdWon: number;
  sources: SourceRef[];
  missing: string[];
}

export function carTaxData(year: number): CarTaxData {
  const doc = CAR_DOCS[year];
  if (!doc) throw new RangeError(`${year}년 자동차세 데이터 없음`);
  const missing: string[] = [];
  const tax: CarTaxParams = {
    ccBrackets: pick(doc, "values.ccBrackets", missing),
    flatAnnualWon: pick(doc, "values.flatAnnualWon", missing),
    educationTaxRate: pick(doc, "values.educationTaxRate", missing),
    ageReduction: pick(doc, "values.ageReduction", missing),
    truncateUnit: pick(doc, "values.truncateUnit", missing),
  };
  const prepay: PrepayParams = {
    rate: pick(doc, "values.prepayRate", missing),
    periods: pick<PrepayPeriod[]>(doc, "values.prepayPeriods", missing),
    secondHalfDays: pick(doc, "values.secondHalfDays", missing),
    educationTaxRate: tax.educationTaxRate,
    truncateUnit: tax.truncateUnit,
  };
  pick(doc, "rules.carAge", missing);
  pick(doc, "rules.prepayDiscount", missing);
  return {
    year,
    tax,
    prepay,
    dueDates: pick(doc, "values.dueDates", missing),
    smallTaxThresholdWon: pick<{ thresholdWon: number }>(doc, "values.smallTaxRule", missing)?.thresholdWon,
    sources: refs(doc, CAR_KEYS),
    missing,
  };
}

export interface InspectionData {
  params: InspectionParams;
  cycle: InspectionCycle & { appliesToRegisteredFrom: string };
  /** 기능별로 아직 확인 안 된 항목. 빈 배열이어야 그 기능을 공개한다 */
  missing: { window: string[]; penalty: string[]; estimate: string[]; fees: string[] };
  penaltyMaxReductionRate: number;
  sources: SourceRef[];
}

export function inspectionData(): InspectionData {
  const doc = inspectionDoc as unknown as DataDoc;
  const window: string[] = [];
  const penalty: string[] = [];
  const estimate: string[] = [];
  const fees: string[] = [];
  const w = pick<{ before: number; after: number }>(doc, "values.windowDays", window);
  const tiers = pick<PenaltyTier[]>(doc, "values.penaltyTiers", penalty);
  const cap = pick<number>(doc, "values.penaltyCapWon", penalty);
  pick(doc, "rules.overdueCount", penalty);
  const cycle = pick<{ everyYears: number; firstAfterYears: number; appliesToRegisteredFrom: string }>(doc, "values.cyclePassengerPrivate", estimate);
  pick(doc, "rules.validityStart", estimate);
  pick(doc, "rules.firstExpiry", estimate);
  pick(doc, "values.fees", fees);
  const discretion = pick<{ maxReductionRate: number }>(doc, "values.penaltyDiscretion", penalty);
  return {
    params: { windowDaysBefore: w?.before, windowDaysAfter: w?.after, penaltyTiers: tiers, penaltyCapWon: cap },
    cycle,
    missing: { window, penalty, estimate, fees },
    penaltyMaxReductionRate: discretion?.maxReductionRate,
    sources: refs(doc, ["values.windowDays", "values.cyclePassengerPrivate", "values.penaltyTiers", "values.penaltyDiscretion", "rules.validityStart"]),
  };
}

export interface EvRegion {
  code: string;
  name: string;
  baseDate: string;
  source_url: string;
}

export interface EvSubsidyData {
  year: number;
  models: EvModel[];
  regions: EvRegion[];
  baseDate: string;
  /**
   * 기능별 확인 대기 항목. 빈 배열이어야 그 기능을 공개한다.
   * - regionData: 데이터에 있는 지역(예: 제주) 합계 — 국비·지방비 모두 그 지역 공개 데이터
   * - nationwide: 다른 지역에 국비를 그대로 적용하는 것
   * - conversion: 전환지원금 대상 조건 설명
   */
  missing: { regionData: string[]; nationwide: string[]; conversion: string[] };
  sources: SourceRef[];
}

const EV_DOCS: Record<number, DataDoc & { regions: Record<string, { name: string; baseDate: string; source_url: string }> }> = {
  2026: ev2026 as unknown as DataDoc & { regions: Record<string, { name: string; baseDate: string; source_url: string }> },
};
export const EV_SUBSIDY_YEARS = Object.keys(EV_DOCS).map(Number);

export function evSubsidyData(year: number): EvSubsidyData {
  const doc = EV_DOCS[year];
  if (!doc) throw new RangeError(`${year}년 전기차 보조금 데이터 없음`);
  const regionData: string[] = [];
  const nationwide: string[] = [];
  const conversion: string[] = [];
  const models = pick<EvModel[]>(doc, "values.models", regionData) ?? [];
  pick(doc, "rules.nationalUniform", nationwide);
  pick(doc, "rules.conversionEligibility", conversion);
  const regions = Object.entries(doc.regions).map(([code, r]) => ({ code, ...r }));
  return {
    year,
    models,
    regions,
    baseDate: doc.values.models?.effective_date ?? "",
    missing: { regionData, nationwide, conversion },
    sources: refs(doc, ["values.models"]),
  };
}
