import { analyticsMetricsMethods } from "./analytics";
import { dashboardMetricsMethods } from "./dashboard";
import { financeMetricsMethods } from "./finance";
import { financialStructureMetricsMethods } from "./financialStructure";
import { insightMetricsMethods } from "./insights";
import { marketingMetricsMethods } from "./marketing";
import { strategyMetricsMethods } from "./strategy";
import { summaryMetricsMethods } from "./summary";
import { unitEconomicsMetricsMethods } from "./unitEconomics";
export const metricsDomainMethods = [
    dashboardMetricsMethods,
    financeMetricsMethods,
    marketingMetricsMethods,
    unitEconomicsMetricsMethods,
    strategyMetricsMethods,
    analyticsMetricsMethods,
    financialStructureMetricsMethods,
    insightMetricsMethods,
    summaryMetricsMethods,
] as const;
