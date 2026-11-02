import type { ComponentType } from "react";
import type { GuideMeta } from "@/lib/guides";
import CarTaxPrepayTiming from "./car-tax-prepay-timing";
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
};
