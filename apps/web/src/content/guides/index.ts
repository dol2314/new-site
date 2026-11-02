import type { ComponentType } from "react";
import type { GuideMeta } from "@/lib/guides";
import BalloonInstallmentLastPayment from "./balloon-installment-last-payment";
import CarTaxInstallmentVsPrepay from "./car-tax-installment-vs-prepay";
import CarTaxPrepayTiming from "./car-tax-prepay-timing";
import DownPaymentRatioInterest from "./down-payment-ratio-interest";
import UsedCarAcquisitionTaxBase from "./used-car-acquisition-tax-base";
import NewCarFirstYearCarTax from "./new-car-first-year-car-tax";
import UsedCarTaxByAge from "./used-car-tax-by-age";
import CashVsCarInstallment from "./cash-vs-car-installment";
import EvSubsidyExtraSupport from "./ev-subsidy-extra-support";
import MultiChildCarAcquisitionTax from "./multi-child-car-acquisition-tax";
import CompactCarAcquisitionTax from "./compact-car-acquisition-tax";
import EvCarTaxFlatRate from "./ev-car-tax-flat-rate";
import PublicChargingFeeChange from "./public-charging-fee-change";
import CarTaxTransferProration from "./car-tax-transfer-proration";
import EvAcquisitionTaxYearEnd from "./ev-acquisition-tax-year-end";
import EvVsGasoline5Years from "./ev-vs-gasoline-5-years";
import HomeVsFastChargingCost from "./home-vs-fast-charging-cost";

/** slug → 글 본문. lib/guides.ts 목록과 짝을 맞춘다 */
export const GUIDE_BODIES: Record<string, ComponentType<{ meta: GuideMeta }>> = {
  "ev-acquisition-tax-year-end": EvAcquisitionTaxYearEnd,
  "car-tax-prepay-timing": CarTaxPrepayTiming,
  "car-tax-transfer-proration": CarTaxTransferProration,
  "home-vs-fast-charging-cost": HomeVsFastChargingCost,
  "ev-vs-gasoline-5-years": EvVsGasoline5Years,
  "ev-car-tax-flat-rate": EvCarTaxFlatRate,
  "compact-car-acquisition-tax": CompactCarAcquisitionTax,
  "public-charging-fee-change": PublicChargingFeeChange,
  "multi-child-car-acquisition-tax": MultiChildCarAcquisitionTax,
  "ev-subsidy-extra-support": EvSubsidyExtraSupport,
  "cash-vs-car-installment": CashVsCarInstallment,
  "used-car-tax-by-age": UsedCarTaxByAge,
  "new-car-first-year-car-tax": NewCarFirstYearCarTax,
  "balloon-installment-last-payment": BalloonInstallmentLastPayment,
  "car-tax-installment-vs-prepay": CarTaxInstallmentVsPrepay,
  "used-car-acquisition-tax-base": UsedCarAcquisitionTaxBase,
  "down-payment-ratio-interest": DownPaymentRatioInterest,
};
