import type { ComponentType } from "react";
import type { GuideMeta } from "@/lib/guides";
import CarTaxPrepayTiming from "./car-tax-prepay-timing";
import CarTaxTransferProration from "./car-tax-transfer-proration";
import EvAcquisitionTaxYearEnd from "./ev-acquisition-tax-year-end";
import HomeVsFastChargingCost from "./home-vs-fast-charging-cost";

/** slug → 글 본문. lib/guides.ts 목록과 짝을 맞춘다 */
export const GUIDE_BODIES: Record<string, ComponentType<{ meta: GuideMeta }>> = {
  "ev-acquisition-tax-year-end": EvAcquisitionTaxYearEnd,
  "car-tax-prepay-timing": CarTaxPrepayTiming,
  "car-tax-transfer-proration": CarTaxTransferProration,
  "home-vs-fast-charging-cost": HomeVsFastChargingCost,
};
